import { useState } from "react";
import { useMutation } from "convex/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { api, Id } from "../lib/convexGenerated";

interface AuthPageProps {
  onLogin: (session: {
    token: string;
    userId: Id<"platformUsers">;
    roles: string[];
    name: string;
    expiresAt: number;
  }) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adminSignIn = useMutation(api.auth.adminSignIn);

  const handleSubmit = async (e: React.FormEvent) => {
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
        token: result.token,
        userId: result.userId,
        roles: result.roles,
        name: result.name,
        expiresAt: result.expiresAt,
      });
    } catch (err) {
      setError("Email ou senha inválidos");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
              <span className="text-primary-foreground text-[28px]">A</span>
            </div>
          </div>
          <CardTitle>Allecto Admin</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
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
                <button
                  type="button"
                  className="text-primary hover:underline"
                >
                  Esqueceu a senha?
                </button>
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
            {error && (
              <p className="text-destructive text-sm" role="status">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-center text-muted-foreground">
              Precisa de ajuda?{" "}
              <a href="#" className="text-primary hover:underline">
                Contate o suporte
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
