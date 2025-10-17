"use client";

import { useState, useTransition } from "react";
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
import { toast } from "sonner";

interface InviteSyndicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condoId: string | null;
  condoName?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function InviteSyndicModal({
  open,
  onOpenChange,
  condoId,
  condoName,
}: InviteSyndicModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setName("");
    setEmail("");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!condoId) return;

    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error("Informe um email válido");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/invites/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            condoId,
            email: trimmedEmail,
            name: name.trim() || undefined,
          }),
        });

        const json = await response.json().catch(() => ({ ok: false }));
        if (!response.ok || !json?.ok) {
          throw new Error("Invite failure");
        }

        toast.success("Convite enviado");
        resetForm();
        onOpenChange(false);
      } catch (error) {
        console.error("Failed to send invite", error);
        toast.error("Não foi possível enviar o convite");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          resetForm();
        }
        onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Síndico</DialogTitle>
          <DialogDescription>
            Envie um convite por email para que o síndico assuma o acesso ao Allecto.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {condoName && (
            <p className="text-sm text-muted-foreground">
              Condomínio selecionado: <strong>{condoName}</strong>
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="invite-name">Nome (opcional)</Label>
            <Input
              id="invite-name"
              placeholder="Nome do síndico"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="sindico@exemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isPending}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !condoId}>
              {isPending ? "Enviando..." : "Enviar convite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
