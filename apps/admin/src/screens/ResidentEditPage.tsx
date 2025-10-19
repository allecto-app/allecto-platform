"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import { useAction, useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Id, api } from "../lib/convexGenerated";
import type { ResidentRecord } from "../types/resident";

interface ResidentEditPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
  residentId?: Id<"residents"> | null;
  residentFallback?: ResidentRecord | null;
  onResidentUpdated?: (resident: ResidentRecord) => void;
}

const ROLE_LABELS: Record<string, string> = {
  resident: "Morador",
  syndic: "Síndico",
  manager: "Gestor",
  council: "Conselho",
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  role: "resident",
  isActive: true,
};

export function ResidentEditPage({
  onNavigate,
  condoId: _condoId,
  residentId,
  residentFallback,
  onResidentUpdated,
}: ResidentEditPageProps) {
  const detail = useQuery(
    api.residentDetail.get,
    residentId
      ? { residentId }
      : residentFallback?.email
      ? { email: residentFallback.email }
      : "skip",
  );
  const updateResident = useMutation(api.residents.update);
  const resendOtp = useAction(api.residentDetail.resendOtp);

  const residentFromQuery = detail?.resident ?? null;
  const resident = residentFromQuery ?? residentFallback ?? null;
  const isLoading = residentId != null && detail === undefined;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastResidentId, setLastResidentId] = useState<string | null>(null);

  useEffect(() => {
    if (!resident) return;
    if (lastResidentId === resident.id && initialForm) return;
    const next: FormState = {
      name: resident.name ?? "",
      email: resident.email ?? "",
      phone: resident.phone ?? "",
      role: resident.role ?? "resident",
      isActive: resident.isActive,
    };
    setForm(next);
    setInitialForm(next);
    setErrors({});
    setLastResidentId(resident.id);
  }, [resident, initialForm, lastResidentId]);

  const formattedCreatedAt = resident?.createdAt
    ? format(new Date(resident.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : "-";
  const formattedUpdatedAt = resident?.updatedAt
    ? format(new Date(resident.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : "-";

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      nextErrors.name = "Informe o nome";
    }
    if (!form.email.trim()) {
      nextErrors.email = "Informe o email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Email inválido";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const isDirty = useMemo(() => {
    if (!initialForm) return false;
    return (
      form.name !== initialForm.name ||
      form.email !== initialForm.email ||
      form.phone !== initialForm.phone ||
      form.role !== initialForm.role ||
      form.isActive !== initialForm.isActive
    );
  }, [form, initialForm]);

  const handleSave = async () => {
    if (!resident || !resident.id) return;
    if (!validate()) {
      toast.error("Corrija os erros antes de salvar");
      return;
    }

    const payload: FormState = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      isActive: form.isActive,
    };

    setIsSaving(true);
    try {
      const result = await updateResident({
        residentId: resident.id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        isActive: payload.isActive,
      });

      const updatedFromServer = result?.resident as ResidentRecord | null | undefined;
      const updatedRecord: ResidentRecord = updatedFromServer ?? {
        ...resident,
        name: payload.name,
        email: payload.email.length > 0 ? payload.email : null,
        phone: payload.phone.length > 0 ? payload.phone : null,
        role: payload.role,
        isActive: payload.isActive,
        updatedAt: Date.now(),
      };

      const normalizedForm: FormState = {
        name: updatedRecord.name ?? "",
        email: updatedRecord.email ?? "",
        phone: updatedRecord.phone ?? "",
        role: updatedRecord.role ?? "resident",
        isActive: updatedRecord.isActive,
      };

      setForm(normalizedForm);
      setInitialForm(normalizedForm);
      onResidentUpdated?.(updatedRecord);

      toast.success("Morador atualizado com sucesso");
      onNavigate("resident-detail");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível atualizar o morador");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onNavigate("resident-detail");
  };

  const handleSendOTP = async () => {
    if (!resident?.email) {
      toast.error("Residente sem email cadastrado");
      return;
    }
    try {
      await resendOtp({ residentId: resident.id });
      toast.success("Novo código enviado");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível enviar o OTP");
    }
  };

  if (isLoading || !resident || !initialForm) {
    return (
      <div className="flex h-full items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando morador...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Editar ${resident.name}`}
        breadcrumb={["Moradores", resident.name, "Editar"]}
        primaryAction={{
          label: "Salvar",
          onClick: handleSave,
          disabled: isSaving || !isDirty,
        }}
        secondaryAction={{
          label: "Cancelar",
          onClick: handleCancel,
        }}
      />

      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Identidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-destructive">{errors.email}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <p className="text-muted-foreground">Formato sugerido: (XX) XXXXX-XXXX</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Função & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select
                value={form.role}
                onValueChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">{ROLE_LABELS.resident}</SelectItem>
                  <SelectItem value="manager">{ROLE_LABELS.manager}</SelectItem>
                  <SelectItem value="syndic">{ROLE_LABELS.syndic}</SelectItem>
                  <SelectItem value="council">{ROLE_LABELS.council}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground">Define o nível de acesso do morador.</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="active-status">Status</Label>
                <p className="text-muted-foreground">
                  {form.isActive
                    ? "Morador pode acessar o sistema"
                    : "Morador sem acesso ao sistema"}
                </p>
              </div>
              <Switch
                id="active-status"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isActive: Boolean(checked) }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Criado em</div>
                <div>{formattedCreatedAt}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Atualizado em</div>
                <div>{formattedUpdatedAt}</div>
              </div>
            </div>
            <Button variant="outline" onClick={handleSendOTP}>
              <Mail className="mr-2 h-4 w-4" />
              Enviar novo OTP
            </Button>
            <p className="text-muted-foreground">
              Um novo código de acesso será enviado para o email do morador.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isDirty}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
