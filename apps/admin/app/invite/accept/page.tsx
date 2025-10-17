"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../src/lib/convexGenerated";
import { Card, CardContent, CardHeader, CardTitle } from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { toast } from "sonner";

type Status = "loading" | "success" | "error";

export default function InviteAcceptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const acceptInvite = useMutation(api.invites.accept);
  const [status, setStatus] = useState<Status>("loading");

  const token = useMemo(() => searchParams.get("token"), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setStatus("error");
        return;
      }
      try {
        await acceptInvite({ token });
        if (cancelled) return;
        setStatus("success");
        toast.success("Convite aceito!");
      } catch (error) {
        console.error("Invite acceptance failed", error);
        if (cancelled) return;
        setStatus("error");
        toast.error("Link inválido ou expirado.");
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [acceptInvite, token]);

  const handleGoToLogin = () => {
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceitar convite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {status === "loading" && <p>Validando convite…</p>}
          {status === "success" && (
            <div className="space-y-4">
              <p>Convite aceito com sucesso! Agora você pode acessar o portal usando suas credenciais.</p>
              <Button onClick={handleGoToLogin}>Ir para o login</Button>
            </div>
          )}
          {status === "error" && (
            <div className="space-y-4">
              <p>Link inválido ou expirado.</p>
              <p>Solicite um novo convite ao administrador do condomínio.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
