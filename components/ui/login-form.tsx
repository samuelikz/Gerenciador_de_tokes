"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

type LoginResp = { success?: boolean; message?: string };

function getErrorMessage(err: unknown, fallback = "Falha no login"): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = (await res.json().catch(() => ({}))) as LoginResp;
      if (!res.ok || body?.success === false) {
        const msg = body?.message || "Falha no login";
        toast.error(msg);
        return;
      }

      toast.success("Login efetuado com sucesso!");
      router.replace("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-9", className)} {...props}>
      <Card className="h-[350px] overflow-hidden p-0 shadow-lg md:rounded-lg md:border md:shadow-none">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Acesso restrito</h1>
                <p className="text-balance text-muted-foreground">
                  Faça login com sua conta de acesso.
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@local.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-invalid={false}
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digitar senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-invalid={false}
                />
              </div>

              <Button type="submit" className="mt-3 w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </form>

          <div className="relative bg-muted">
            <Image
              src="/logo.png"
              alt="Fill"
              fill
              priority
              className="object-fill"
              sizes="(max-width: 768px) 0, (min-width: 769px) 50vw"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary">
        <p className="text-center text-sm text-muted-foreground">
          Não conseguiu acessar sua conta?{" "}
          <a href="mailto:suportesiga@perpart.com.br" className="font-medium">
            Entre em contato com o suporte
          </a>{" "}
          e nossa equipe irá te ajudar.
        </p>
      </div>
    </div>
  );
}
