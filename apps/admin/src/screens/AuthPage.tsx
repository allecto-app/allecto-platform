"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { api } from "../lib/convexGenerated";
import { AdminAuthSession } from "../lib/authSession";
import { useHostInfo } from "../lib/hostContext";
import { toast } from "sonner";
import Image from "next/image";

interface AuthPageProps {
  onLogin: (session: AdminAuthSession) => void;
}

type Mode = "platform" | "resident";

export function AuthPage({ onLogin }: AuthPageProps) {
  const hostInfo = useHostInfo();
  const hostSubdomain = hostInfo.isCondoSubdomain ? hostInfo.subdomain ?? "" : "";
  const residentModeForced = hostInfo.isCondoSubdomain;
  const platformLoginEnabled = hostInfo.isPortal && !hostInfo.isCondoSubdomain;

  const [mode, setMode] = useState<Mode>(residentModeForced ? "resident" : "platform");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [residentSubdomain, setResidentSubdomain] = useState(hostSubdomain);
  const [residentEmail, setResidentEmail] = useState("");
  const [residentCode, setResidentCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [residentDevCode, setResidentDevCode] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [residentError, setResidentError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<"request" | "verify">("request");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotDevCode, setForgotDevCode] = useState<string | null>(null);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const adminSignIn = useMutation(api.auth.adminSignIn);
  const requestResidentOtp = useMutation(api.auth.requestResidentOtp);
  const residentSignIn = useMutation(api.auth.residentSignIn);
  const requestPasswordReset = useMutation(api.auth.requestPasswordReset);
  const resetPassword = useMutation(api.auth.resetPassword);

  useEffect(() => {
    if (residentModeForced) {
      setMode("resident");
      setResidentSubdomain(hostSubdomain);
    }
  }, [residentModeForced, hostSubdomain]);

  const resetForms = () => {
    setError(null);
    setResidentError(null);
    setIsSubmitting(false);
    setIsVerifyingOtp(false);
    setIsSendingOtp(false);
    setOtpSent(false);
    setResidentCode("");
    setResidentEmail("");
    setResidentDevCode(null);
    setPassword("");
    setEmail("");
    setForgotOpen(false);
    resetForgotState();
    setForgotEmail("");
    if (!residentModeForced) {
      setResidentSubdomain("");
    }
  };

  function resetForgotState() {
    setForgotStep("request");
    setForgotCode("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotError(null);
    setForgotDevCode(null);
    setIsRequestingReset(false);
    setIsResettingPassword(false);
  }

  const handleForgotOpenChange = (open: boolean) => {
    setForgotOpen(open);
    if (open) {
      setForgotEmail((prev) => (prev ? prev : email));
      setForgotStep("request");
      setForgotError(null);
      setForgotDevCode(null);
      setForgotCode("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
    } else {
      resetForgotState();
      setForgotEmail("");
    }
  };

  const handleModeChange = (value: string) => {
    if (value === "platform" && !platformLoginEnabled) {
      return;
    }
    const nextMode = value as Mode;
    setMode(nextMode);
    resetForms();
    if (residentModeForced) {
      setResidentSubdomain(hostSubdomain);
    }
  };

  const handleRequestPasswordReset = async () => {
    setForgotError(null);
    const emailValue = forgotEmail.trim().toLowerCase();
    if (!emailValue) {
      setForgotError("Informe um email válido.");
      return;
    }
    setIsRequestingReset(true);
    try {
      const result = await requestPasswordReset({ email: emailValue });
      setForgotDevCode(result?.devCode ?? null);
      setForgotCode("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
      if (forgotStep !== "verify") {
        setForgotStep("verify");
      }
    } catch (error) {
      console.error("Failed to request password reset", error);
      setForgotError("Não foi possível enviar o código. Tente novamente.");
    } finally {
      setIsRequestingReset(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotError(null);
    const emailValue = forgotEmail.trim().toLowerCase();
    if (!emailValue) {
      setForgotError("Informe um email válido.");
      return;
    }
    if (forgotCode.trim().length !== 6) {
      setForgotError("Informe o código de 6 dígitos.");
      return;
    }
    if (forgotNewPassword.length < 8) {
      setForgotError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("As senhas informadas não coincidem.");
      return;
    }

    setIsResettingPassword(true);
    try {
      await resetPassword({
        email: emailValue,
        code: forgotCode.trim(),
        newPassword: forgotNewPassword,
      });
      toast.success("Senha redefinida com sucesso! Faça login com a nova senha.");
      setEmail(emailValue);
      setPassword("");
      handleForgotOpenChange(false);
    } catch (error) {
      console.error("Failed to reset password", error);
      setForgotError("Não foi possível redefinir a senha. Verifique o código e tente novamente.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const tabsColumnsClass = platformLoginEnabled ? "grid w-full grid-cols-2" : "grid w-full grid-cols-1";
  const currentResidentSubdomain = residentModeForced ? hostSubdomain : residentSubdomain;
  const canSendOtp = Boolean(currentResidentSubdomain.trim() && residentEmail.trim());

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await adminSignIn({
        email: email.trim().toLowerCase(),
        password,
      });
      if (!result?.success) {
        throw new Error("Invalid credentials");
      }
      onLogin({
        type: "platform",
        token: result.token,
        userId: result.userId,
        roles: result.roles,
        name: result.name,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      console.error(error);
      setError("Email ou senha inválidos");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResidentOtp = async () => {
    setResidentError(null);
    setResidentDevCode(null);
    const subdomainValue = (residentModeForced ? hostSubdomain : residentSubdomain)
      .trim()
      .toLowerCase();
    const emailValue = residentEmail.trim().toLowerCase();
    if (!subdomainValue || !emailValue) {
      setResidentError("Informe subdomínio e email");
      return;
    }
    setIsSendingOtp(true);
    try {
      const result = await requestResidentOtp({
        subdomain: subdomainValue,
        email: emailValue,
      });
      setResidentDevCode(result?.devCode ?? null);
      setResidentCode("");
      setOtpSent(true);
    } catch (error) {
      console.error(error);
      setResidentError("Não foi possível enviar o código");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResidentSignIn = async () => {
    setResidentError(null);
    if (residentCode.length !== 6) {
      setResidentError("Informe o código recebido");
      return;
    }
    const subdomainValue = (residentModeForced ? hostSubdomain : residentSubdomain)
      .trim()
      .toLowerCase();
    const emailValue = residentEmail.trim().toLowerCase();
    if (!subdomainValue || !emailValue) {
      setResidentError("Informe subdomínio e email");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const result = await residentSignIn({
        subdomain: subdomainValue,
        email: emailValue,
        code: residentCode,
      });
      if (!result?.success) {
        throw new Error("Invalid code");
      }
      onLogin({
        type: "resident",
        token: result.token,
        userId: result.residentId,
        roles: result.roles,
        name: result.name,
        expiresAt: result.expiresAt,
        condoId: result.condoId,
        condoName: result.condo.name,
        condoSubdomain: result.condo.subdomain,
      });
    } catch (error) {
      console.error(error);
      setResidentError("Código inválido ou expirado");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-accent to-primary p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="my-4 flex justify-center">
            <Image src="/images/logo-allecto.png" alt="Allecto App" width={200} height={46} />
          </div>
          <CardDescription>
            Acesse com credenciais da plataforma ou com o código enviado ao síndico/gestor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={handleModeChange} className="space-y-4">
            <TabsList className={tabsColumnsClass}>
              {platformLoginEnabled && (
                <TabsTrigger value="platform">
                  Plataforma
                </TabsTrigger>
              )}
              <TabsTrigger value="resident">Síndico / Gestor</TabsTrigger>
            </TabsList>

            {platformLoginEnabled && (
              <TabsContent value="platform">
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@demo.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <Dialog open={forgotOpen} onOpenChange={handleForgotOpenChange}>
                        <DialogTrigger asChild>
                          <button type="button" className="text-primary hover:underline">
                            Esqueceu a senha?
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          {forgotStep === "request" ? (
                            <>
                              <DialogHeader>
                                <DialogTitle>Redefinir senha</DialogTitle>
                                <DialogDescription>
                                  Informe o email cadastrado para receber um código de redefinição.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="forgot-email">Email</Label>
                                  <Input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="admin@exemplo.com"
                                    value={forgotEmail}
                                    onChange={(event) => setForgotEmail(event.target.value)}
                                  />
                                </div>
                                {forgotError && (
                                  <p className="text-sm text-destructive">{forgotError}</p>
                                )}
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => handleForgotOpenChange(false)}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={handleRequestPasswordReset}
                                  disabled={isRequestingReset}
                                >
                                  {isRequestingReset ? "Enviando..." : "Enviar código"}
                                </Button>
                              </DialogFooter>
                            </>
                          ) : (
                            <>
                              <DialogHeader>
                                <DialogTitle>Confirme o código</DialogTitle>
                                <DialogDescription>
                                  Verifique seu email e informe o código de 6 dígitos para definir uma nova senha.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="reset-code">Código de 6 dígitos</Label>
                                  <InputOTP
                                    value={forgotCode}
                                    onChange={setForgotCode}
                                    maxLength={6}
                                  >
                                    <InputOTPGroup>
                                      {Array.from({ length: 6 }).map((_, index) => (
                                        <InputOTPSlot key={index} index={index} />
                                      ))}
                                    </InputOTPGroup>
                                  </InputOTP>
                                  {forgotDevCode && (
                                    <p className="text-xs text-muted-foreground">
                                      Código (ambiente de testes):{" "}
                                      <span className="font-mono">{forgotDevCode}</span>
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="new-password">Nova senha</Label>
                                  <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={forgotNewPassword}
                                    onChange={(event) => setForgotNewPassword(event.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    A senha deve ter pelo menos 8 caracteres.
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                                  <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Repita a nova senha"
                                    value={forgotConfirmPassword}
                                    onChange={(event) =>
                                      setForgotConfirmPassword(event.target.value)
                                    }
                                  />
                                </div>
                                {forgotError && (
                                  <p className="text-sm text-destructive">{forgotError}</p>
                                )}
                              </div>
                              <DialogFooter className="sm:justify-between">
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleRequestPasswordReset}
                                    disabled={isRequestingReset}
                                  >
                                    {isRequestingReset ? "Reenviando..." : "Reenviar código"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setForgotStep("request");
                                      setForgotError(null);
                                      setForgotCode("");
                                      setForgotDevCode(null);
                                    }}
                                  >
                                    Voltar
                                  </Button>
                                </div>
                                <Button
                                  onClick={handleResetPassword}
                                  disabled={isResettingPassword}
                                >
                                  {isResettingPassword ? "Atualizando..." : "Atualizar senha"}
                                </Button>
                              </DialogFooter>
                            </>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                    />
                  </div>
                  {error && <p className="text-destructive text-sm">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
            )}

            <TabsContent value="resident">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resident-subdomain">Subdomínio do condomínio</Label>
                  {residentModeForced ? (
                    <Input
                      id="resident-subdomain"
                      value={hostSubdomain}
                      readOnly
                      disabled
                    />
                  ) : (
                    <Input
                      id="resident-subdomain"
                      placeholder="ex: jardim-flores"
                      value={residentSubdomain}
                      onChange={(e) => {
                        setResidentSubdomain(e.target.value);
                        setResidentError(null);
                        setResidentDevCode(null);
                      }}
                    />
                  )}
                  {residentModeForced && hostSubdomain && (
                    <p className="text-muted-foreground text-xs">
                      Você está acessando o portal do condomínio <strong>{hostSubdomain}</strong>.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resident-email">Email</Label>
                  <Input
                    id="resident-email"
                    type="email"
                    placeholder="sindico@demo.com"
                    value={residentEmail}
                    onChange={(e) => {
                      setResidentEmail(e.target.value);
                      setResidentError(null);
                      setResidentDevCode(null);
                    }}
                  />
                </div>

                {!otpSent ? (
                  <Button
                    onClick={handleSendResidentOtp}
                    className="w-full"
                    disabled={isSendingOtp || !canSendOtp}
                  >
                    {isSendingOtp ? "Enviando..." : "Enviar código"}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-sm">Digite o código enviado ao seu email.</p>
                    <div className="space-y-2">
                      <Label>Código recebido</Label>
                      <InputOTP
                        maxLength={6}
                        value={residentCode}
                        onChange={(value) => {
                          setResidentCode(value);
                          setResidentError(null);
                        }}
                      >
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <InputOTPSlot key={index} index={index} className="h-12 w-12" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                      {residentDevCode && (
                        <p className="text-muted-foreground text-xs">Código para testes: {residentDevCode}</p>
                      )}
                    </div>
                    <Button
                      onClick={handleResidentSignIn}
                      className="w-full"
                      disabled={isVerifyingOtp || residentCode.length !== 6}
                    >
                      {isVerifyingOtp ? "Entrando..." : "Entrar"}
                    </Button>
                  </div>
                )}

                {residentError && <p className="text-destructive text-sm">{residentError}</p>}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-center text-muted-foreground text-sm">
            Precisa de ajuda? <a href="#" className="text-primary hover:underline">Contate o suporte</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
