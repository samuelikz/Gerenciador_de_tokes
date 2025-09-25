// app/dashboard/documentos/page.tsx
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { IconClipboard, IconExternalLink } from "@tabler/icons-react"
import clsx from "clsx"

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="rounded-md border bg-muted/40 p-3 overflow-x-auto text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  )
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={clsx("cursor-pointer", className)}
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
    >
      <IconClipboard className="mr-2 size-4" />
      {copied ? "Copiado!" : "Copiar"}
    </Button>
  )
}

/** Monta URLs sem // duplicado e inclui apenas params definidos */
function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>
) {
  const base = (baseUrl || "").replace(/\/+$/, "")
  const cleanPath = (path || "").replace(/^\/+/, "")
  const url = `${base}/${cleanPath}`

  const params = new URLSearchParams()
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && String(v) !== "") params.append(k, String(v))
    }
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

function LinkBlock({
  href,
  curl,
  label = "Abrir URL",
  right,
}: {
  href: string
  curl: string
  label?: string
  right?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm underline">
          <IconExternalLink className="mr-1 size-4" />
          {label}
        </a>
        <CopyButton text={href} />
        {right}
      </div>
      <Code>{curl}</Code>
    </div>
  )
}

export default function DocumentosPage() {
  // Configuração
  const [baseUrl, setBaseUrl] = React.useState("http://localhost:3333")
  const [apiKey, setApiKey] = React.useState("SEU_API_KEY")

  // Parâmetros de exemplo (EXATAMENTE como solicitado)
  const [page, setPage] = React.useState("1")
  const [pageSize, setPageSize] = React.useState("10")
  const [search, setSearch] = React.useState("rua das flores")
  const [numgMunicipio, setNumgMunicipio] = React.useState("recife")
  const [numgDestinacao, setNumgDestinacao] = React.useState("venda")
  const [imovelId, setImovelId] = React.useState("938") // BigInt como string

  // URLs prontas (usando os valores exatamente como estão nos campos)
  const urlListQuery = buildUrl(baseUrl, "/imoveis", { apikey: apiKey, page, pageSize })
  const urlListHeader = buildUrl(baseUrl, "/imoveis", { page, pageSize })
  const urlSearch = buildUrl(baseUrl, "/imoveis", { apikey: apiKey, search })
  const urlMunicipio = buildUrl(baseUrl, "/imoveis", { apikey: apiKey, numg_municipio: numgMunicipio })
  const urlDest = buildUrl(baseUrl, "/imoveis", { apikey: apiKey, numg_destinacao: numgDestinacao })
  const urlCombo = buildUrl(baseUrl, "/imoveis", {
    apikey: apiKey,
    numg_municipio: numgMunicipio,
    numg_destinacao: numgDestinacao,
    search,
  })
  const urlGetByIdQuery = buildUrl(baseUrl, `/imoveis/${imovelId}`, { apikey: apiKey })
  const urlGetByIdHeader = buildUrl(baseUrl, `/imoveis/${imovelId}`)

  // cURLs
  const curlListQuery = `curl "${urlListQuery}"`
  const curlListHeader = `curl "${urlListHeader}" \\\n  -H "x-api-key: ${apiKey}"`
  const curlSearch = `curl "${urlSearch}"`
  const curlMunicipio = `curl "${urlMunicipio}"`
  const curlDest = `curl "${urlDest}"`
  const curlCombo = `curl "${urlCombo}"`
  const curlGetByIdQuery = `curl "${urlGetByIdQuery}"`
  const curlGetByIdHeader = `curl "${urlGetByIdHeader}" -H "x-api-key: ${apiKey}"`
  const curlPost = `# NÃO IMPLEMENTADO
# Endpoint de criação ainda não disponível no backend.
# Quando estiver implementado, use algo como:
# curl -X POST "${buildUrl(baseUrl, "/imoveis")}" \\
#   -H "x-api-key: ${apiKey}" \\
#   -H "Content-Type: application/json" \\
#   -d '{
#     "numg_imovel": "987654321000001",
#     "desc_logradouro": "Av. Nova, 200",
#     "numg_municipio": "recife",
#     "numg_destinacao": "venda"
#   }'`

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Título */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Documentos</h2>
        <p className="text-sm text-muted-foreground">
          Exemplos estáticos de uso da API do módulo <strong>Imóveis</strong>. Informe sua{" "}
          <code>BASE_URL</code> e <code>x-api-key</code>, ajuste os parâmetros e use os links/cURLs.
        </p>
      </div>

      {/* AUTENTICAÇÃO */}
      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="text-base">Autenticação e Base</CardTitle>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="px-2">x-api-key</Badge>
            <Badge variant="outline" className="px-2">Headers</Badge>
            <Badge variant="outline" className="px-2">Query</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="base-url">BASE_URL</Label>
            <Input id="base-url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="http://localhost:3321" />
            <p className="text-xs text-muted-foreground">Ex.: <code>http://localhost:3321</code></p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="api-key">API key</Label>
            <Input id="api-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="SEU_API_KEY" />
            <p className="text-xs text-muted-foreground">
              Pode ser enviada via query (<code>?apikey=</code>) ou header <code>x-api-key</code> (recomendado).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PARÂMETROS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parâmetros (GET /imoveis)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="page">page</Label>
            <Input id="page" value={page} onChange={(e) => setPage(e.target.value)} />
            <p className="text-xs text-muted-foreground">Página (inicia em 1). Padrão: <code>1</code>.</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pageSize">pageSize</Label>
            <Input id="pageSize" value={pageSize} onChange={(e) => setPageSize(e.target.value)} />
            <p className="text-xs text-muted-foreground">Itens por página. Ex.: <code>10</code>, <code>20</code>.</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="search">search</Label>
            <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} />
            <p className="text-xs text-muted-foreground">Busca textual (ex.: logradouro). Ex.: <code>rua das flores</code>.</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="municipio">numg_municipio</Label>
            <Input id="municipio" value={numgMunicipio} onChange={(e) => setNumgMunicipio(e.target.value)} />
            <p className="text-xs text-muted-foreground">Código IBGE do município (ex.: <code>2604106</code> Recife).</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="destinacao">numg_destinacao</Label>
            <Input id="destinacao" value={numgDestinacao} onChange={(e) => setNumgDestinacao(e.target.value)} />
            <p className="text-xs text-muted-foreground">Código de destinação (ex.: <code>1</code>).</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="imovel-id">ID do imóvel (numg_imovel)</Label>
            <Input id="imovel-id" value={imovelId} onChange={(e) => setImovelId(e.target.value)} />
            <p className="text-xs text-muted-foreground">BigInt como string. Ex.: <code>123456789012345</code>. (Atual: <code>{imovelId}</code>)</p>
          </div>
        </CardContent>
      </Card>

      {/* Paginação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listar (Paginação)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <LinkBlock
            href={urlListQuery}
            curl={curlListQuery}
            label="Abrir (apikey na query)"
            right={<CopyButton text={curlListQuery} />}
          />
          <div className="pt-1">
            <LinkBlock
              href={urlListHeader}
              curl={curlListHeader}
              label="Abrir (header recomendado)"
              right={<CopyButton text={curlListHeader} />}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Preferir o header <code>x-api-key</code> evita expor a chave na URL.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Busca por texto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <LinkBlock
            href={urlSearch}
            curl={curlSearch}
            label="Abrir (apikey na query)"
            right={<CopyButton text={curlSearch} />}
          />
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-2">numg_municipio</Badge>
            </div>
            <LinkBlock
              href={urlMunicipio}
              curl={curlMunicipio}
              label="Abrir (apikey na query)"
              right={<CopyButton text={curlMunicipio} />}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-2">numg_destinacao</Badge>
            </div>
            <LinkBlock
              href={urlDest}
              curl={curlDest}
              label="Abrir (apikey na query)"
              right={<CopyButton text={curlDest} />}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-2">Combinação</Badge>
              <Badge variant="outline" className="px-2">município + destinação + search</Badge>
            </div>
            <LinkBlock
              href={urlCombo}
              curl={curlCombo}
              label="Abrir (apikey na query)"
              right={<CopyButton text={curlCombo} />}
            />
          </section>
        </CardContent>
      </Card>

      {/* Por ID */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Obter por ID</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <LinkBlock
            href={urlGetByIdQuery}
            curl={curlGetByIdQuery}
            label="Abrir (apikey na query)"
            right={<CopyButton text={curlGetByIdQuery} />}
          />
          <div className="pt-1">
            <LinkBlock
              href={urlGetByIdHeader}
              curl={curlGetByIdHeader}
              label="Abrir (header recomendado)"
              right={<CopyButton text={curlGetByIdHeader} />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Criação (não implementado) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Criar imóvel (POST)</CardTitle>
            <Badge variant="secondary" className="px-2">Não implementado</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Code>{curlPost}</Code>
          <p className="text-xs text-muted-foreground">
            Este endpoint ainda não está disponível no backend. Quando for implementado, será necessário o escopo <code>WRITE</code> e envio da chave no header <code>x-api-key</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
