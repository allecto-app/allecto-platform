"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Upload, FileDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { Button } from "../ui/button";
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
import { ScrollArea } from "../ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";

import { api, Doc } from "../../lib/convexGenerated";
import {
  BULK_TEMPLATE_PATH,
  BulkCsvError,
  BulkCsvRow,
  MembershipRole,
  parseBulkCsv,
} from "../../utils/bulkUpload";
import { roleFormatter } from "src/utils/textFormatter";

type BulkUploadResponse = {
  summary: {
    unitsCreated: number;
    unitsUpdated: number;
    residentsCreated: number;
    residentsUpdated: number;
    membershipsCreated: number;
    skippedRows: number;
  };
  errors: BulkCsvError[];
};

interface BulkUploadButtonProps {
  condo: Doc<"condos"> | null;
}

export function BulkUploadButton({ condo }: BulkUploadButtonProps) {
  const [open, setOpen] = useState(false);

  if (!condo) {
    return (
      <Button variant="outline" disabled>
        <Upload className="mr-2 h-4 w-4" />
        Bulk Upload
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Bulk Upload
      </Button>
      <BulkUploadDialog open={open} onOpenChange={setOpen} condo={condo} />
    </>
  );
}

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condo: Doc<"condos">;
}

function BulkUploadDialog({
  open,
  onOpenChange,
  condo,
}: BulkUploadDialogProps) {
  const bulkUpload = useMutation(api.imports.bulkUpload);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rows, setRows] = useState<BulkCsvRow[]>([]);
  const [localErrors, setLocalErrors] = useState<BulkCsvError[]>([]);
  const [serverResult, setServerResult] = useState<BulkUploadResponse | null>(
    null,
  );

  const hasValidPayload = rows.length > 0 && localErrors.length === 0;

  const stats = useMemo(() => {
    let unitCount = 0;
    let residentCount = 0;
    let membershipCount = 0;
    rows.forEach((row) => {
      if (row.unit) unitCount += 1;
      if (row.resident) residentCount += 1;
      if (row.unit && row.resident) membershipCount += 1;
    });
    return { unitCount, residentCount, membershipCount };
  }, [rows]);

  const resetState = useCallback(() => {
    setFileName(null);
    setRows([]);
    setLocalErrors([]);
    setServerResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      setIsParsing(true);
      setServerResult(null);
      try {
        const result = await parseBulkCsv(file);
        setFileName(file.name);
        setRows(result.rows);
        setLocalErrors(result.errors);
        if (result.errors.length === 0 && result.rows.length > 0) {
          toast.success(`Arquivo "${file.name}" pronto para importação.`);
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível processar o arquivo selecionado.",
        );
        setRows([]);
        setLocalErrors([
          {
            rowNumber: 0,
            message:
              "Não foi possível ler o arquivo. Tente novamente com um CSV válido.",
          },
        ]);
      } finally {
        setIsParsing(false);
      }
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!hasValidPayload) {
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = rows.map((row) => ({
        rowNumber: row.rowNumber,
        unit: row.unit ?? undefined,
        resident: row.resident ?? undefined,
      }));

      const result = (await bulkUpload({
        condoId: condo._id,
        rows: payload,
      })) as BulkUploadResponse;

      setServerResult(result);
      const errorCount = result.errors.length;
      if (errorCount > 0) {
        toast.warning(
          `Importação concluída com ${errorCount} linha(s) com erro.`,
        );
      } else {
        toast.success("Importação concluída com sucesso!");
        resetState();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a importação.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [bulkUpload, condo._id, hasValidPayload, resetState, rows]);

  const closeDialog = useCallback(
    (next: boolean) => {
      onOpenChange(next);
      if (!next) {
        resetState();
      }
    },
    [onOpenChange, resetState],
  );

  const renderRowSummary = (row: BulkCsvRow) => {
    const membershipLabel: MembershipRole | undefined =
      row.resident?.membershipRole ??
      (row.unit && row.resident ? "owner" : undefined);

    return (
      <TableRow key={row.rowNumber}>
        <TableCell className="text-muted-foreground text-sm">
          {row.rowNumber}
        </TableCell>
        <TableCell>
          {row.unit ? (
            <div className="flex flex-col text-sm">
              <span className="font-medium">{row.unit.code}</span>
              <span className="text-muted-foreground">
                Bloco {row.unit.block ?? "--"} • Andar {row.unit.floor ?? "--"}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">--</span>
          )}
        </TableCell>
        <TableCell>
          {row.resident ? (
            <div className="flex flex-col text-sm">
              <span className="font-medium">{row.resident.name}</span>
              <span className="text-muted-foreground">
                {row.resident.email ?? "Sem email"}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">--</span>
          )}
        </TableCell>
        <TableCell>
          {row.resident ? (
            <Badge variant="outline">
              {roleFormatter(row.resident.role ?? "resident")}
              {membershipLabel ? ` • ${roleFormatter(membershipLabel)}` : ""}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">--</span>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar unidades e moradores</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV para criar ou atualizar unidades,
            moradores e vínculos de forma automática.{" "}
            <a
              href={BULK_TEMPLATE_PATH}
              download
              className="inline-flex items-center font-medium text-primary underline-offset-2 hover:underline"
            >
              <FileDown className="mr-1 h-4 w-4" />
              Baixar modelo CSV
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-upload-input">Selecione o arquivo CSV</Label>
            <Input
              id="bulk-upload-input"
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              disabled={isSubmitting}
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              O arquivo deve conter as colunas: unit_code, unit_block,
              unit_floor, resident_name, resident_email, resident_phone,
              resident_role e membership_role. Você pode preencher apenas os
              campos necessários em cada linha.
            </p>
            {fileName && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado:{" "}
                <span className="font-medium">{fileName}</span>
              </p>
            )}
          </div>

          {localErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="text-destructive" />
              <AlertTitle>Erros encontrados no CSV</AlertTitle>
              <AlertDescription>
                {localErrors.slice(0, 5).map((error) => (
                  <p key={`${error.rowNumber}-${error.message}`}>
                    Linha {error.rowNumber}: {error.message}
                  </p>
                ))}
                {localErrors.length > 5 && (
                  <p>...e mais {localErrors.length - 5} erro(s).</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <Badge variant="secondary">
                  {stats.unitCount} unidade{stats.unitCount === 1 ? "" : "s"}
                </Badge>
                <Badge variant="secondary">
                  {stats.residentCount} morador
                  {stats.residentCount === 1 ? "" : "es"}
                </Badge>
                <Badge variant="secondary">
                  {stats.membershipCount} vínculo
                  {stats.membershipCount === 1 ? "" : "s"}
                </Badge>
              </div>
              <ScrollArea className="max-h-64 rounded-md border overflow-scroll">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Morador</TableHead>
                      <TableHead>Função</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 25).map((row) => renderRowSummary(row))}
                  </TableBody>
                </Table>
              </ScrollArea>
              {rows.length > 25 && (
                <p className="text-xs text-muted-foreground">
                  Apenas as primeiras 25 linhas são exibidas na prévia.
                </p>
              )}
            </div>
          )}

          {serverResult && (
            <Alert className="overflow-scroll">
              <CheckCircle2 className="text-emerald-500" />
              <AlertTitle>Resumo da importação</AlertTitle>
              <AlertDescription>
                <p>
                  Unidades: {serverResult.summary.unitsCreated} novas e{" "}
                  {serverResult.summary.unitsUpdated} atualizadas.
                </p>
                <p>
                  Moradores: {serverResult.summary.residentsCreated} novos e{" "}
                  {serverResult.summary.residentsUpdated} atualizados.
                </p>
                <p>
                  Vínculos criados: {serverResult.summary.membershipsCreated}.
                  Linhas ignoradas: {serverResult.summary.skippedRows}.
                </p>
                {serverResult.errors.length > 0 && (
                  <div className="mt-2">
                    {serverResult.errors.slice(0, 5).map((error) => (
                      <p key={`server-${error.rowNumber}-${error.message}`}>
                        Linha {error.rowNumber}: {error.message}
                      </p>
                    ))}
                    {serverResult.errors.length > 5 && (
                      <p>...e mais {serverResult.errors.length - 5} erro(s).</p>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => closeDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasValidPayload || isParsing || isSubmitting}
          >
            {isSubmitting ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
