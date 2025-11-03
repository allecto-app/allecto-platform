"use node";

import Stripe from "stripe";
import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { sendEmail, DEFAULT_FROM } from "../../lib/email";
import { normalizeEmail } from "../../_secu";
import type { Id } from "../../_generated/dataModel";
import { getStripeClient } from "../../stripe/client";
import { normalizeTierKey } from "./helpers";
import { api } from "../../_generated/api";

const PLAN_LABELS: Record<string, string> = {
  essencial: "Essencial",
  plus: "Plus",
  pro: "Pró",
};

const PLAN_LIMITS: Record<string, string> = {
  essencial: "2 assembleias/mês, 5 GB documentos",
  plus: "Assembleias ilimitadas, 20 GB documentos",
  pro: "Assembleias/Enquetes ilimitadas, 200 GB documentos",
};

const PORTAL_BASE_URL =
  process.env.ADMIN_PORTAL_URL ?? "https://portal.allecto.app";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "suporte@allecto.app";
const SUPPORT_PHONE = process.env.SUPPORT_PHONE ?? "(11) 4000-1234";

function formatBRL(cents: number | null | undefined) {
  if (typeof cents !== "number") return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(timestamp: number | null | undefined) {
  if (typeof timestamp !== "number") return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));
}

type TenantRecord = {
  name: string;
  billingTier?: string;
  branding?: {
    displayName?: string;
  };
  subdomain?: string;
};

type ResidentRecord = {
  name: string;
  email?: string;
};

function resolveCustomerEmail(customer: unknown): string | null {
  if (
    customer &&
    typeof customer === "object" &&
    "email" in customer &&
    !("deleted" in customer)
  ) {
    return (customer as { email?: string | null }).email ?? null;
  }
  return null;
}

async function fetchLatestResident(
  ctx: any,
  tenantId: Id<"condos">
): Promise<ResidentRecord | null> {
  const residents = (await ctx.runQuery(api.residents.list, {
    condoId: tenantId,
  })) as any[];
  if (!residents || residents.length === 0) return null;
  const sorted = residents
    .filter((resident) => resident?.isActive !== false)
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  return sorted[0] ?? null;
}

function toMillis(value: number | null | undefined) {
  return typeof value === "number" ? value * 1000 : undefined;
}

async function extractPaymentDetails(
  stripe: Stripe,
  invoice: Stripe.Invoice | null | undefined
) {
  if (!invoice) {
    return {
      invoiceNumber: "-",
      amountDue: null,
      paymentMethodBrand: "-",
      paymentLast4: "-",
      paymentMethodDetails: "-",
    };
  }

  const paymentIntent =
    typeof invoice.payment_intent === "object"
      ? (invoice.payment_intent as Stripe.PaymentIntent)
      : null;
  let charges: Stripe.Charge[] = [];
  if (paymentIntent?.latest_charge) {
    const charge = await stripe.charges.retrieve(
      paymentIntent.latest_charge as string
    );
    charges = [charge];
  } else if (Array.isArray((paymentIntent as any)?.charges?.data)) {
    charges = ((paymentIntent as any).charges.data ?? []) as Stripe.Charge[];
  }
  const charge = charges[0];
  const paymentMethod = charge?.payment_method_details;

  let paymentMethodBrand = "-";
  let paymentLast4 = "-";
  if (paymentMethod?.card) {
    paymentMethodBrand = paymentMethod.card.brand ?? "Cartão";
    paymentLast4 = paymentMethod.card.last4 ?? "****";
  }

  return {
    invoiceNumber: invoice.number ?? invoice.id ?? "-",
    amountDue: invoice.amount_paid ?? invoice.amount_due ?? null,
    paymentMethodBrand,
    paymentLast4,
  };
}

async function loadStripeData(
  stripe: Stripe,
  subscriptionId: string,
  invoiceId: string | null
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  });

  const invoice = invoiceId
    ? await stripe.invoices.retrieve(invoiceId, {
        expand: ["payment_intent.payment_method"],
      })
    : null;

  return { subscription, invoice };
}

function resolvePlanInfo(price: Stripe.Price | string | null | undefined) {
  if (!price || typeof price === "string") {
    return { tier: null, amount: null, planName: "Plano" };
  }
  const amount = price.unit_amount ?? null;
  const tier = normalizeTierKey(price.metadata?.tierKey ?? null);
  const planName = (tier && PLAN_LABELS[tier]) || price.nickname || "Plano";
  return { tier, amount, planName };
}

export const sendOnboardingSuccessEmail = internalAction({
  args: {
    tenantId: v.id("condos"),
    subscriptionId: v.string(),
    invoiceId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx: any, args) => {
    const tenant = (await ctx.runQuery(api.billing.getTenantIfExists, {
      tenantId: args.tenantId,
    })) as TenantRecord | null;
    if (!tenant) {
      console.warn("[billing.email] Tenant not found", args.tenantId);
      return;
    }

    const resident = await fetchLatestResident(ctx, args.tenantId);
    const residentEmail = resident?.email
      ? normalizeEmail(resident.email)
      : null;

    const stripe = getStripeClient();

    const { subscription, invoice } = await loadStripeData(
      stripe,
      args.subscriptionId,
      args.invoiceId ?? null
    );

    const price = subscription.items?.data?.[0]?.price ?? null;
    const customerEmail =
      resolveCustomerEmail(subscription.customer) ?? residentEmail;

    if (!customerEmail) {
      console.warn(
        "[billing.email] No customer email found for tenant",
        args.tenantId
      );
      return;
    }

    const planInfo = resolvePlanInfo(price);
    const { amount } = planInfo;
    const resolvedTier = normalizeTierKey(planInfo.tier);
    const fallbackTier = normalizeTierKey(tenant.billingTier ?? null);
    const planTier = resolvedTier ?? fallbackTier ?? "essencial";
    const planName = PLAN_LABELS[planTier] ?? planInfo.planName;
    const priceFormatted = formatBRL(amount);
    const nextBillingDate = formatDate(
      toMillis(subscription.current_period_end)
    );

    const loginHost = tenant.subdomain
      ? `https://${tenant.subdomain}.allecto.app`
      : PORTAL_BASE_URL;
    const portalUrl = `${loginHost}`;
    const tenantDisplayName = tenant.branding?.displayName ?? tenant.name;
    const adminName = resident?.name ?? "Administrador";
    const adminEmail = residentEmail ?? customerEmail;
    const planLimits = PLAN_LIMITS[planTier] ?? PLAN_LIMITS.essencial;

    const subject = `Bem-vindo(a) à Allecto! Seu plano ${planName} foi ativado ✅`;

    const html = `
      <p>Olá ${adminName},</p>
      <p>Seu pagamento foi confirmado e seu plano <strong>${planName}</strong> está ativo. 🎉</p>
      <p>
        Acesse agora o portal da Allecto para começar:<br/>
        <a href="${portalUrl}">${portalUrl}</a><br/>
        (use seu e-mail <strong>${customerEmail}</strong> para entrar)
      </p>
      <p><strong>Resumo do pagamento:</strong><br/>
        • Plano: ${planName}<br/>
        • Valor: ${priceFormatted}<br/>
        • Próxima cobrança: ${nextBillingDate}
      </p>
      <p><strong>Dados da sua conta:</strong><br/>
        • Condomínio/Empresa: ${tenantDisplayName}<br/>
        • Administrador(a): ${adminName} (${adminEmail})<br/>
        • Licenças/limites do plano: ${planLimits}
      </p>
      <p><strong>Dicas rápidas:</strong><br/>
        • Para convidar outros moradores, entre em Painel → Moradores.<br/>
        • Precisa atualizar o cartão ou cancelar? Acesse “Assinatura” no portal.
      </p>
      <p>Se não reconhece esta cobrança, fale com nosso suporte.</p>
      <p>Abraços,<br/>Equipe Allecto<br/>Suporte: ${SUPPORT_EMAIL} | ${SUPPORT_PHONE}</p>
    `;

    const text = `Olá ${adminName},

Seu pagamento foi confirmado e seu plano ${planName} está ativo. 🎉

Acesse agora o portal da Allecto para começar:
${portalUrl}
(use seu e-mail ${customerEmail} para entrar)

Resumo do pagamento:
• Plano: ${planName}
• Valor: ${priceFormatted}
• Próxima cobrança: ${nextBillingDate}

Dados da sua conta:
• Condomínio/Empresa: ${tenantDisplayName}
• Administrador(a): ${adminName} (${adminEmail})
• Licenças/limites do plano: ${planLimits}

Dicas rápidas:
• Para convidar outros moradores, entre em Configurações → Moradores.
• Precisa atualizar o cartão ou cancelar? Acesse “Assinatura” no portal.

Se não reconhece esta cobrança, fale com nosso suporte.

Abraços,
Equipe Allecto
Suporte: ${SUPPORT_EMAIL} | ${SUPPORT_PHONE}`;

    await sendEmail({
      to: customerEmail,
      subject,
      html,
      text,
      from: DEFAULT_FROM,
    });
  },
});
