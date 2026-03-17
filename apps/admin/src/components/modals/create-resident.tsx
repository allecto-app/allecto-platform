"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { api, type Doc, type Id } from "../../lib/convexGenerated";

type ResidentRole = "resident" | "syndic" | "manager" | "council";
type MembershipRole = "owner" | "tenant";

interface CreateResidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condoId: Id<"condos"> | null;
  condoName?: string | null;
  sessionToken: string;
}

const roleOptions: Array<{ value: ResidentRole; label: string }> = [
  { value: "resident", label: "Morador" },
  { value: "council", label: "Conselho" },
  { value: "manager", label: "Gestor" },
  { value: "syndic", label: "Síndico" },
];

const membershipRoleOptions: Array<{ value: MembershipRole; label: string }> = [
  { value: "owner", label: "Proprietário" },
  { value: "tenant", label: "Inquilino" },
];

const NO_UNIT_VALUE = "__none";

type FormState = {
  name: string;
  email: string;
  phone: string;
  role: ResidentRole;
  unitId: string;
  membershipRole: MembershipRole | "";
};

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  role: "resident",
  unitId: NO_UNIT_VALUE,
  membershipRole: "",
};

export function CreateResidentModal({
  open,
  onOpenChange,
  condoId,
  condoName,
  sessionToken,
}: CreateResidentModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createResident = useMutation(api.residents.create);
  const units = useQuery(
    api.units.listByCondo,
    condoId ? { sessionToken, condoId } : "skip",
  ) as Doc<"units">[] | undefined;

  const availableUnits = useMemo(() => {
    if (!units) return [];
    return units.slice().sort((a, b) => a.code.localeCompare(b.code));
  }, [units]);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open]);

  const updateField = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      nextErrors.name = "Informe o nome do morador";
    }
    const email = form.email.trim();
    if (!email) {
      nextErrors.email = "Informe o e-mail";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email)) {
      nextErrors.email = "E-mail inválido";
    }

    if (form.unitId !== NO_UNIT_VALUE && !form.membershipRole) {
      nextErrors.membershipRole = "Selecione o tipo de vínculo";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!condoId) {
      toast.error("Selecione um condomínio para criar moradores");
      return;
    }
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const hasUnitLink = form.unitId !== NO_UNIT_VALUE;

      await createResident({
        sessionToken,
        condoId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        unitLink: hasUnitLink
          ? {
              unitId: form.unitId as Id<"units">,
              membershipRole: form.membershipRole as MembershipRole,
            }
          : undefined,
      });
      toast.success("Morador criado com sucesso");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create resident", error);
      toast.error(
        error instanceof Error ? error.message : "Não foi possível criar o morador",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Morador</DialogTitle>
          <DialogDescription>
            Cadastre um morador para{" "}
            <strong>{condoName ?? "o condomínio selecionado"}</strong> e,
            se desejar, vincule uma unidade.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="resident-name">Nome *</Label>
            <Input
              id="resident-name"
              placeholder="Nome completo"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="resident-email">E-mail *</Label>
            <Input
              id="resident-email"
              type="email"
              placeholder="morador@exemplo.com"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="resident-phone">Telefone</Label>
            <Input
              id="resident-phone"
              placeholder="(00) 00000-0000"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resident-role">Função</Label>
            <Select
              value={form.role}
              onValueChange={(value: ResidentRole) => updateField("role", value)}
            >
              <SelectTrigger id="resident-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resident-unit">Unidade (opcional)</Label>
              <Select
                value={form.unitId}
                onValueChange={(value) => {
                  updateField("unitId", value);
                  if (value === NO_UNIT_VALUE) {
                    updateField("membershipRole", "");
                  }
                }}
              >
                <SelectTrigger id="resident-unit">
                  <SelectValue placeholder="Selecionar unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_UNIT_VALUE}>Sem vínculo</SelectItem>
                  {availableUnits.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Nenhuma unidade disponível
                    </SelectItem>
                  ) : (
                    availableUnits.map((unit) => (
                      <SelectItem key={unit._id} value={unit._id}>
                        {unit.block ? `${unit.block} - ${unit.code}` : unit.code}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="membership-role">Tipo de vínculo</Label>
              <Select
                value={form.membershipRole}
                onValueChange={(value: MembershipRole | "") =>
                  updateField("membershipRole", value)
                }
                disabled={form.unitId === NO_UNIT_VALUE}
              >
                <SelectTrigger id="membership-role">
                  <SelectValue placeholder={form.unitId ? "Selecione o tipo" : "Selecione uma unidade"} />
                </SelectTrigger>
                <SelectContent>
                  {membershipRoleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.membershipRole && (
                <p className="text-sm text-destructive">{errors.membershipRole}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !condoId}>
              {isSubmitting ? "Salvando..." : "Criar morador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
