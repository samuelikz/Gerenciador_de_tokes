// app/dashboard/tokens/page.tsx
"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRole } from "@/components/auth/role-context" // 👈 pega a role do layout

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select"
import {
  IconPlus, IconSearch, IconReload, IconDotsVertical, IconDownload, IconClipboard
} from "@tabler/icons-react"

type ApiToken = {
  id: string
  userId: string
  createdByUserId: string
  scope: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  revokedAt: string | null
  description: string | null
  createdByName: string | null
  createdByEmail: string | null
  ownerName: string | null
  ownerEmail: string | null
}

type CreateResp = {
  success?: boolean
  data?: { token: ApiToken; apiKey: string }
  token?: ApiToken
  apiKey?: string
}

function fmtDate(d?: string | null) {
  if (!d) return "—"
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" })
      .format(new Date(d))
  } catch { return d ?? "—" }
}
const isAtivo = (t: ApiToken) => !!(t.isActive && !t.revokedAt)
const toMs = (d?: string | null) => (d ? new Date(d).getTime() : 0)
const toIsoZ = (dateStr?: string) => (dateStr ? `${dateStr}T00:00:00.000Z` : null)

export default function TokensPage() {
  const role = useRole()
  const isAdmin = role === "ADMIN"

  // tabela
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [items, setItems] = React.useState<ApiToken[]>([])
  const [loaded, setLoaded] = React.useState(false)

  // criar
  const [openCreate, setOpenCreate] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [scope, setScope] = React.useState<string>("READ")
  const [expiresDate, setExpiresDate] = React.useState<string>("")
  const [description, setDescription] = React.useState<string>("")

  // resultado
  const [openResult, setOpenResult] = React.useState(false)
  const [apiKey, setApiKey] = React.useState<string>("")
  const [createdPayload, setCreatedPayload] = React.useState<{ token: ApiToken; apiKey: string } | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/tokens", { method: "GET", cache: "no-store" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body?.success === false) {
        throw new Error(body?.error?.message || "Falha ao carregar tokens")
      }
      setItems(body?.data ?? [])
      setLoaded(true)
    } catch (err: any) {
      toast.error(err?.message || "Erro ao buscar tokens")
    } finally {
      setLoading(false)
    }
  }, [])
  React.useEffect(() => { load() }, [load])

  const filtered = React.useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter((t) =>
      (t.description ?? "").toLowerCase().includes(q) ||
      (t.ownerEmail ?? "").toLowerCase().includes(q) ||
      (t.ownerName ?? "").toLowerCase().includes(q) ||
      (t.scope ?? "").toLowerCase().includes(q)
    )
  }, [items, query])

  const filteredSorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aa = isAtivo(a) ? 1 : 0
      const bb = isAtivo(b) ? 1 : 0
      if (aa !== bb) return bb - aa
      const ca = toMs(a.createdAt)
      const cb = toMs(b.createdAt)
      if (ca !== cb) return cb - ca
      const ea = toMs(a.expiresAt)
      const eb = toMs(b.expiresAt)
      return eb - ea
    })
  }, [filtered])

  async function revokeToken(tokenId: string) {
    try {
      const res = await fetch("/api/tokens", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body?.success === false) {
        throw new Error(body?.error?.message || "Falha ao revogar token")
      }
      toast.success("Token revogado")
      await load()
    } catch (err: any) {
      toast.error(err?.message || "Erro ao revogar")
    }
  }

  async function createToken(e: React.FormEvent) {
    e.preventDefault()
    try {
      setCreating(true)

      // defesa extra no payload
      const finalScope = isAdmin ? scope : "READ"

      const payload = {
        scope: finalScope,
        expiresAt: toIsoZ(expiresDate),
        description: description || null,
      }

      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body: CreateResp = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        const msg = (body as any)?.error?.message || "Não foi possível criar o token"
        throw new Error(msg)
      }

      // { success:true, data:{ token, apiKey } }
      const apiKeyFromData = body?.data?.apiKey ?? body?.apiKey ?? ""
      const tokenObj = body?.data?.token ?? body?.token

      setApiKey(String(apiKeyFromData || ""))
      setCreatedPayload(
        tokenObj && apiKeyFromData ? { token: tokenObj as ApiToken, apiKey: apiKeyFromData } : null
      )

      setOpenCreate(false)
      setOpenResult(true)

      setScope("READ")
      setExpiresDate("")
      setDescription("")

      await load()
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar token")
    } finally {
      setCreating(false)
    }
  }

  function copyApiKey() {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    toast.success("Chave copiada")
  }

  function downloadJson() {
    const content = JSON.stringify(createdPayload ?? {}, null, 2)
    const blob = new Blob([content], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const nameFromId = createdPayload?.token?.id ? `token-${createdPayload.token.id}.json` : "token.json"
    a.download = nameFromId
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">Tokens de Acesso</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-8 w-64"
              placeholder="Buscar por descrição, dono ou escopo…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={load} disabled={loading} className="cursor-pointer">
            <IconReload className={loading ? "size-4 animate-spin" : "size-4"} />
          </Button>

          {/* Dialog: criar token */}
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer">
                <IconPlus className="mr-2 size-4" />
                Novo token
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar novo token</DialogTitle>
              </DialogHeader>

              <form onSubmit={createToken} className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="scope">Escopo</Label>

                  {isAdmin ? (
                    <Select value={scope} onValueChange={setScope}>
                      <SelectTrigger id="scope">
                        <SelectValue placeholder="Selecione o escopo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="READ">READ</SelectItem>
                        <SelectItem value="WRITE">WRITE</SelectItem>
                        <SelectItem value="READ_WRITE">READ_WRITE</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    // usuário comum: travado em READ
                    <Select value="READ" onValueChange={() => {}} disabled>
                      <SelectTrigger id="scope">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="READ">READ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="expires">Expira em (opcional)</Label>
                  <Input
                    id="expires"
                    type="date"
                    value={expiresDate}
                    onChange={(e) => setExpiresDate(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="desc">Descrição (opcional)</Label>
                  <Input
                    id="desc"
                    placeholder="Ex.: Chave de leitura para integração X"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenCreate(false)} className="cursor-pointer">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating} className="cursor-pointer">
                    {creating ? "Criando..." : "Criar token"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog: resultado com a apiKey e JSON */}
          <Dialog open={openResult} onOpenChange={setOpenResult}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Token gerado</DialogTitle>
              </DialogHeader>

              <div className="grid gap-3">
                <p className="text-sm text-muted-foreground">
                  Guarde esta chave com segurança. Ela pode ser exibida apenas agora.
                </p>

                <div className="rounded-md border bg-muted/30 p-3">
                  <code className="block w-full break-all text-sm">
                    {apiKey || "—"}
                  </code>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyApiKey} className="cursor-pointer">
                    <IconClipboard className="mr-2 size-4" />
                    Copiar token
                  </Button>
                  <Button variant="outline" onClick={downloadJson} className="cursor-pointer">
                    <IconDownload className="mr-2 size-4" />
                    Baixar JSON
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setOpenResult(false)} className="cursor-pointer">
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Dono</TableHead>
                  <TableHead className="hidden xl:table-cell">E-mail do dono</TableHead>
                  <TableHead className="hidden md:table-cell">Criado em</TableHead>
                  <TableHead className="hidden md:table-cell">Expira em</TableHead>
                  <TableHead className="hidden sm:table-cell">Escopo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredSorted.length ? (
                  filteredSorted.map((t) => {
                    const ativo = isAtivo(t)
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.description || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">{t.ownerName || "—"}</TableCell>
                        <TableCell className="hidden xl:table-cell">{t.ownerEmail || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">{fmtDate(t.createdAt)}</TableCell>
                        <TableCell className="hidden md:table-cell">{fmtDate(t.expiresAt)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="px-2">{t.scope || "—"}</Badge>
                        </TableCell>
                        <TableCell>
                          {ativo ? (
                            <Badge variant="outline" className="px-2">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary" className="px-2">Revogado</Badge>
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
                              {ativo ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => revokeToken(t.id)}
                                    className="text-destructive cursor-pointer"
                                  >
                                    Revogar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              ) : (
                                <DropdownMenuItem disabled>Revogado</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
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
  )
}
