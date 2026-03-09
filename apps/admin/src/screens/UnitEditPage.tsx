import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Trash2, Users } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { api, Id } from "../lib/convexGenerated";
import type { UnitRecord } from "../types/unit";

type MembershipRole = "owner" | "tenant";

type UnitDetailMembership = {
  membershipId: Id<"memberships">;
  resident: {
    id: Id<"residents">;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
    isActive: boolean;
  };
  membershipRole: MembershipRole | null;
  linkedAt: number;
};

type UnitDetailResponse = {
  unit: UnitRecord;
  memberships: UnitDetailMembership[];
  votes: unknown[];
} | null;

interface UnitEditPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
  unitId?: Id<"units"> | null;
  unitFallback?: UnitRecord | null;
  onUnitLoaded?: (unit: UnitRecord) => void;
  onUnitUpdated?: (unit: UnitRecord) => void;
  onUnitDeleted?: () => void;
}

type FormState = {
  code: string;
  block: string;
  floor: string;
};

const emptyForm: FormState = {
  code: "",
  block: "",
  floor: "",
};

export function UnitEditPage({
  onNavigate,
  condoId,
  unitId,
  unitFallback,
  onUnitLoaded,
  onUnitUpdated,
  onUnitDeleted,
}: UnitEditPageProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [initialForm, setInitialForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const detail = useQuery(
    api.units.detail,
    unitId ? { unitId } : "skip",
  ) as UnitDetailResponse | undefined;

  const unitFromQuery = detail && detail !== null ? detail.unit : null;
  const unit = detail === null ? null : unitFromQuery ?? unitFallback ?? null;
  const memberships = detail && detail !== null ? detail.memberships : [];
  const unitIdentifier =
    (unit && "id" in unit && (unit as UnitRecord).id) ||
    (unit && "_id" in unit ? (unit as { _id?: Id<"units"> })._id : null);

  useEffect(() => {
    if (unitFromQuery && onUnitLoaded) {
      onUnitLoaded(unitFromQuery);
    }
  }, [unitFromQuery, onUnitLoaded]);

  useEffect(() => {
    if (!unit) return;
    const next: FormState = {
      code: unit.code ?? "",
      block: unit.block ?? "",
      floor: unit.floor ?? "",
    };
    setForm(next);
    setInitialForm(next);
    setErrors({});
  }, [unitIdentifier]);

  const addUnit = useMutation(api.units.upsert);
  const updateUnit = useMutation(api.units.update);
  const removeUnit = useMutation(api.units.remove);

  const isLoadingDetail = unitId != null && detail === undefined && !unitFallback;
  const isEditing = unit != null;

  const normalizedForm = useMemo(
    () => ({
      code: form.code.trim(),
      block: form.block.trim(),
      floor: form.floor.trim(),
    }),
    [form],
  );

  const normalizedInitial = useMemo(
    () => ({
      code: initialForm.code.trim(),
      block: initialForm.block.trim(),
      floor: initialForm.floor.trim(),
    }),
    [initialForm],
  );

  const isDirty = useMemo(() => {
    return (
      normalizedForm.code !== normalizedInitial.code ||
      normalizedForm.block !== normalizedInitial.block ||
      normalizedForm.floor !== normalizedInitial.floor
    );
  }, [normalizedForm, normalizedInitial]);

  const membershipCount = memberships.length;
  const membershipSummary = useMemo(() => {
    if (membershipCount === 0) {
      return "Nenhum morador vinculado";
    }
    const items = memberships.slice(0, 3).map((membership) => {
      const role =
        membership.membershipRole === "owner"
          ? "proprietário"
          : membership.membershipRole === "tenant"
          ? "inquilino"
          : "sem tipo";
      return `${membership.resident.name} (${role})`;
    });
    const extra = membershipCount - items.length;
    return extra > 0 ? `${items.join(", ")} e mais ${extra}` : items.join(", ");
  }, [membershipCount, memberships]);

  const formatDateTime = (timestamp: number | null | undefined) =>
    typeof timestamp === "number"
      ? new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(timestamp))
      : "-";

  const formattedCreatedAt = formatDateTime(unit?.createdAt ?? null);
  const formattedUpdatedAt = formatDateTime(unit?.updatedAt ?? null);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!normalizedForm.code) {
      nextErrors.code = "Informe o código da unidade";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCancel = () => {
    onNavigate(isEditing ? "unit-detail" : "units");
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Corrija os erros antes de salvar");
      return;
    }
    if (!isDirty) {
      toast.info("Nenhuma alteração para salvar");
      return;
    }

    const payload = {
      code: normalizedForm.code,
      block: normalizedForm.block.length > 0 ? normalizedForm.block : undefined,
      floor: normalizedForm.floor.length > 0 ? normalizedForm.floor : undefined,
    };

    setIsSaving(true);
    try {
      if (isEditing && unit) {
        if (!unitIdentifier) {
          toast.error("Unidade inválida, tente novamente.");
          return;
        }
        const updated = (await updateUnit({
          unitId: unitIdentifier,
          code: payload.code,
          block: payload.block,
          floor: payload.floor,
        })) as UnitRecord | undefined;

        const updatedRecord: UnitRecord = updated ?? {
          id: unitIdentifier,
          condoId: unit.condoId,
          code: payload.code,
          block: payload.block ?? null,
          floor: payload.floor ?? null,
          createdAt: unit.createdAt,
          updatedAt: Date.now(),
          condoName: unit.condoName ?? null,
        };

        const normalized: FormState = {
          code: updatedRecord.code ?? "",
          block: updatedRecord.block ?? "",
          floor: updatedRecord.floor ?? "",
        };
        setForm(normalized);
        setInitialForm(normalized);

        onUnitUpdated?.(updatedRecord);
        toast.success("Unidade atualizada com sucesso");
        onNavigate("unit-detail");
      } else {
        if (!condoId) {
          toast.error("Selecione um condomínio antes de criar a unidade");
          setIsSaving(false);
          return;
        }
        await addUnit({
          condoId,
          code: payload.code,
          block: payload.block,
          floor: payload.floor,
        });
        toast.success("Unidade criada com sucesso");
        onNavigate("units");
      }
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar a unidade");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!unit || !unitIdentifier) return;
    setIsDeleting(true);
    try {
      await removeUnit({ unitId: unitIdentifier });
      toast.success(`Unidade ${unit.code} excluída com sucesso`);
      onUnitDeleted?.();
      onNavigate("units");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível excluir a unidade");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingDetail) {
    return (
      <div className="flex h-full items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando unidade...
      </div>
    );
  }

  if (unitId && detail === null && !unitFallback) {
    return (
      <div>
        <PageHeader
          title="Unidade não encontrada"
          breadcrumb={["Unidades", "Editar"]}
          primaryAction={{
            label: "Voltar",
            onClick: () => onNavigate("units"),
          }}
        />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            A unidade solicitada não foi localizada.
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryLabel = isEditing ? "Salvar alterações" : "Criar unidade";
  const primaryDisabled =
    isSaving || !isDirty || (isEditing && !unit) || (!isEditing && !condoId);

  const breadcrumb = isEditing
    ? ["Unidades", unit?.block ? `${unit.block}-${unit.code}` : unit?.code ?? "-", "Editar"]
    : ["Unidades", "Nova unidade"];

  return (
    <div>
      <PageHeader
        title={isEditing ? `Editar ${unit?.code ?? ""}` : "Nova Unidade"}
        breadcrumb={breadcrumb}
        primaryAction={{
          label: isSaving ? "Salvando..." : primaryLabel,
          onClick: handleSave,
          disabled: primaryDisabled,
        }}
        secondaryAction={{
          label: "Cancelar",
          onClick: handleCancel,
          disabled: isSaving || isDeleting,
        }}
      />

      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Unidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(event) => updateField("code", event.target.value)}
                  className={errors.code ? "border-destructive" : ""}
                  placeholder="101"
                />
                {errors.code && <p className="text-destructive">{errors.code}</p>}
                <p className="text-muted-foreground">Identificador único da unidade</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="block">Bloco</Label>
                <Input
                  id="block"
                  value={form.block}
                  onChange={(event) => updateField("block", event.target.value)}
                  placeholder="A"
                />
                <p className="text-muted-foreground">Deixe em branco se não houver bloco</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Andar</Label>
                <Input
                  id="floor"
                  value={form.floor}
                  onChange={(event) => updateField("floor", event.target.value)}
                  placeholder="1"
                />
                <p className="text-muted-foreground">Ex.: 1, 2, térreo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>Moradores Vinculados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div>
                      {membershipCount} {membershipCount === 1 ? "morador vinculado" : "moradores vinculados"}
                    </div>
                    <div className="text-muted-foreground">{membershipSummary}</div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => onNavigate("unit-detail")}>
                  Gerenciar
                </Button>
              </div>
              <p className="mt-2 text-muted-foreground">
                Use a página de detalhes para adicionar ou remover moradores da unidade.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {isEditing ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Excluindo..." : "Excluir Unidade"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir unidade</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a unidade {unit?.code}? Esta ação não pode ser desfeita e
                    removerá os acessos de moradores vinculados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirmar exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Badge variant="outline" className="w-fit">
              A exclusão estará disponível após a criação da unidade
            </Badge>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving || isDeleting}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={primaryDisabled}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
