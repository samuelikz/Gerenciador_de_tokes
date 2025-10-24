"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRole } from "@/components/auth/role-context";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { IconPlus, IconSearch, IconReload, IconDotsVertical } from "@tabler/icons-react";

// --- TIPOS DE DADOS ---
type Role = "ADMIN" | "USER";

type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ApiErrorShape =
  | { error?: { message?: string } }
  | { message?: string }
  | Record<string, unknown>;

type ListResp = {
  success?: boolean;
  data?: ApiUser[];
  items?: ApiUser[];
  meta?: { page: number; pageSize: number; total: number };
} & ApiErrorShape;

type CreateResp = {
  success?: boolean;
  data?: ApiUser;
  user?: ApiUser;
} & ApiErrorShape;

type UpdateResp = {
  success?: boolean;
  data?: ApiUser;
  user?: ApiUser;
} & ApiErrorShape;

// --- FUNÇÕES DE UTILIDADE ---

type WithToString = { toString(): string };

function fmtDate(d?: unknown) {
  if (d == null) return "—";
  let dt: Date | null = null;

  if (typeof d === "string" || typeof d === "number") dt = new Date(d);
  else if (d instanceof Date) dt = d;
  else if ((d as WithToString) && typeof (d as WithToString).toString === "function") {
    dt = new Date((d as WithToString).toString());
  }

  if (!dt || Number.isNaN(dt.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(dt);
  } catch {
    return "—";
  }
}

function getErrorMessage(err: unknown, fallback = "Ocorreu um erro"): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function extractApiMessage(body: unknown): string | null {
  if (body && typeof body === "object") {
    const maybe = body as Record<string, unknown>;
    const nested = maybe.error as { message?: string } | undefined;
    if (nested?.message) return nested.message;
    const msg = maybe.message;
    if (typeof msg === "string") return msg;
  }
  return null;
}

// --- COMPONENTE PRINCIPAL ---

export default function UsersClientPage() {
  const myRole = useRole();
  const isAdmin = myRole === "ADMIN";

  // --- ESTADOS ---
  // Tabela
  const [query, setQuery] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [items, setItems] = React.useState<ApiUser[]>([]);
  const [loaded, setLoaded] = React.useState<boolean>(false);

  // Criar Usuário
  const [openCreate, setOpenCreate] = React.useState<boolean>(false);
  const [creating, setCreating] = React.useState<boolean>(false);
  const [name, setName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [role, setRole] = React.useState<Role>("USER");
  const [password, setPassword] = React.useState<string>("");

  // --- LÓGICA DE CARREGAMENTO E FILTRO ---

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { method: "GET", cache: "no-store", credentials: "include" });
      const body = await readJson<ListResp>(res);

      if (!res.ok || body?.success === false) {
        throw new Error(extractApiMessage(body) ?? "Falha ao carregar usuários");
      }

      const list: ApiUser[] = Array.isArray(body?.data)
        ? body!.data!
        : Array.isArray(body?.items)
        ? body!.items!
        : [];

      const norm = list.map((u) => ({
        ...u,
        createdAt: typeof u.createdAt === "string" ? u.createdAt : null,
        updatedAt: typeof u.updatedAt === "string" ? u.updatedAt : null,
        isActive: typeof u.isActive === "boolean" ? u.isActive : true,
      }));
      setItems(norm);
      setLoaded(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao buscar usuários"));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.role as string).toLowerCase().includes(q)
    );
  }, [items, query]);

  const filteredSorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      // ADMINs primeiro
      if (a.role !== b.role) return a.role === "ADMIN" ? -1 : 1;
      // Ordena por nome
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [filtered]);

  // --- HANDLERS DE INPUT TIPADOS ---
  const onQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value);
  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value);
  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);

  // --- FUNÇÕES DE AÇÃO ---

  async function createUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAdmin) return toast.error("Apenas administradores podem criar usuários.");
    if (!name.trim()) return toast.error("Nome é obrigatório.");
    if (!email.trim() || !/.+@.+\..+/.test(email)) return toast.error("E-mail inválido.");
    if (!password.trim() || password.length < 6) return toast.error("Senha deve ter pelo menos 6 caracteres.");

    try {
      setCreating(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, role, password }),
      });
      const body = await readJson<CreateResp>(res);
      if (!res.ok || body?.success === false) {
        throw new Error(extractApiMessage(body) ?? "Falha ao criar usuário");
      }
      toast.success("Usuário criado");
      setOpenCreate(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("USER");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao criar usuário"));
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(user: ApiUser) {
    if (!isAdmin) return toast.error("Apenas administradores podem alterar status.");

    const novoIsActive = !user.isActive;

    try {
      const res = await fetch(`/api/users/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        redirect: "manual",
        body: JSON.stringify({ userId: user.id }),
      });

      if (res.status === 307 || res.status === 302) {
        throw new Error("Erro de roteamento (307/302). Verifique a barra final da URL do fetch.");
      }

      const body = await readJson<UpdateResp>(res);
      if (!res.ok || body?.success === false) {
        throw new Error(extractApiMessage(body) ?? "Falha ao alterar status");
      }

      toast.success(novoIsActive ? "Usuário ativado" : "Usuário desativado");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao alterar status"));
    }
  }

  async function changeRole(user: ApiUser, nextRole: Role) {
    if (!isAdmin) return toast.error("Apenas administradores podem alterar o papel.");
    if (user.role === nextRole) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        redirect: "manual",
        body: JSON.stringify({ role: nextRole }),
      });

      const body = await readJson<UpdateResp>(res);
      if (!res.ok || body?.success === false) {
        throw new Error(extractApiMessage(body) ?? "Falha ao alterar papel");
      }

      toast.success(`Papel alterado para ${nextRole}`);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao alterar papel"));
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* HEADER E BUSCA */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">Usuários</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-8 w-64"
              placeholder="Buscar por nome, e-mail ou papel…"
              value={query}
              onChange={onQueryChange}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={load}
            disabled={loading}
            className="cursor-pointer"
            aria-label="Recarregar lista"
          >
            <IconReload className={loading ? "size-4 animate-spin" : "size-4"} />
          </Button>

          {/* DIALOG DE CRIAR USUÁRIO */}
          {isAdmin && (
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button className="cursor-pointer">
                  <IconPlus className="mr-2 size-4" /> Novo usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar novo usuário</DialogTitle>
                </DialogHeader>
                <form onSubmit={createUser} className="grid gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" value={name} onChange={onNameChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={email} onChange={onEmailChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="role">Papel</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">USER</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={onPasswordChange}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenCreate(false)}
                      className="cursor-pointer"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={creating} className="cursor-pointer">
                      {creating ? "Criando..." : "Criar usuário"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* TABELA DE USUÁRIOS */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                  <TableHead className="hidden md:table-cell">Papel</TableHead>
                  <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSorted.length ? (
                  filteredSorted.map((u) => {
                    const ativo = u.isActive !== false;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name || "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell">{u.email || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="px-2">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{fmtDate(u.createdAt)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {ativo ? (
                            <Badge variant="outline" className="px-2">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary" className="px-2">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <IconDotsVertical className="size-4" />
                                <span className="sr-only">Ações</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Alterar Papel */}
                              <DropdownMenuItem
                                onClick={() => changeRole(u, u.role === "ADMIN" ? "USER" : "ADMIN")}
                                className="cursor-pointer"
                              >
                                {u.role === "ADMIN" ? "Rebaixar p/ USER" : "Promover a ADMIN"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* Ativar/Desativar */}
                              <DropdownMenuItem
                                onClick={() => toggleActive(u)}
                                className="cursor-pointer"
                              >
                                {u.isActive === false ? "Ativar" : "Desativar"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {loaded ? "Nada encontrado." : "Carregando…"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
