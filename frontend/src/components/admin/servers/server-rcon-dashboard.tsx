'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ExternalLink, ChevronLeft, Send, Terminal } from 'lucide-react'
import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const SNAPSHOT_MS = 4000
const MAX_PERF_POINTS = 72

type RconConnectionMeta = {
  web_scheme: string
  host: string
  port: number
  password_set: boolean
  note: string
  probe_command: string | null
}

type RconSnapshot = {
  connected?: boolean
  error?: string
  hint?: string
  code?: string
  server_id?: string
  server_name?: string
  raw?: { serverinfo: string; status: string }
  parsed?: Record<string, string>
  command_errors?: Record<string, string>
  connection?: RconConnectionMeta
}

type PerfPoint = {
  seq: number
  at: number
  fps: number | null
  entities: number | null
  netIn: number | null
  netOut: number | null
}

function authHeadersJson(): Record<string, string> {
  const token = getAuthToken()
  const h: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

function authHeadersGet(): Record<string, string> {
  const token = getAuthToken()
  const h: Record<string, string> = { Accept: 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

function pickParsed(parsed: Record<string, string> | undefined, ...keys: string[]): string | undefined {
  if (!parsed) return undefined
  const map = new Map<string, string>()
  for (const [k, v] of Object.entries(parsed)) {
    map.set(k.toLowerCase().replace(/\s+/g, ''), v)
  }
  for (const k of keys) {
    const compact = k.toLowerCase().replace(/\s+/g, '')
    const v = map.get(compact)
    if (v !== undefined && v !== '') return v
  }
  return undefined
}

function parseNumberLoose(v: string | undefined): number | null {
  if (v === undefined) return null
  const n = Number.parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function formatUptimeSeconds(total: number): string {
  if (!Number.isFinite(total) || total < 0) return '—'
  const s = Math.floor(total % 60)
  const m = Math.floor((total / 60) % 60)
  const h = Math.floor(total / 3600)
  if (h > 0) return `${h}h${m}m${s}s`
  if (m > 0) return `${m}m${s}s`
  return `${s}s`
}

function splitIntoColumns(entries: [string, string][], cols: number): [string, string][][] {
  if (entries.length === 0) return Array.from({ length: cols }, () => [])
  const per = Math.ceil(entries.length / cols)
  const out: [string, string][][] = []
  for (let c = 0; c < cols; c++) {
    out.push(entries.slice(c * per, (c + 1) * per))
  }
  return out
}

const NAV: { id: 'server' | 'console' | 'chat' | 'players'; label: string }[] = [
  { id: 'server', label: 'Server' },
  { id: 'console', label: 'Console' },
  { id: 'chat', label: 'Chat' },
  { id: 'players', label: 'Player List' },
]

export function ServerRconDashboard({ serverId, siteServerName }: { serverId: string; siteServerName: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<(typeof NAV)[number]['id']>('server')
  const [consoleLog, setConsoleLog] = useState<string[]>([])
  const [consoleInput, setConsoleInput] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [perfHistory, setPerfHistory] = useState<PerfPoint[]>([])

  const snapshotQuery = useQuery({
    queryKey: ['admin-server-rcon-snapshot', serverId],
    queryFn: async (): Promise<RconSnapshot> => {
      const res = await fetch(backendApi(`admin/servers/${encodeURIComponent(serverId)}/rcon/snapshot`), {
        credentials: 'include',
        headers: authHeadersGet(),
      })
      const json = (await res.json().catch(() => ({}))) as RconSnapshot & { message?: string }
      if (!res.ok) {
        const errMsg = json.error || json.message || `Request failed (${res.status})`
        const hint = typeof json.hint === 'string' && json.hint.trim() !== '' ? json.hint.trim() : ''
        const code = typeof json.code === 'string' ? json.code : ''
        const parts = [errMsg, code ? `[${code}]` : '', hint].filter(Boolean)
        const c = json.connection
        let conn = ''
        if (c?.host && c.port > 0) {
          conn =
            `\n\n── WebRCON URL shape (opened by PHP, default is plain ws://) ──\n${c.web_scheme}://${c.host}:${c.port}/<rcon_password>\n` +
            `password_set: ${String(c.password_set)}\n${c.note}` +
            (c.probe_command ? `\n\nTest from the same machine/container as PHP:\n  ${c.probe_command}` : '')
        }
        throw new Error(parts.join('\n\n') + conn)
      }
      return json
    },
    refetchInterval: SNAPSHOT_MS,
    retry: 1,
  })

  const snapshot = snapshotQuery.data
  const parsed = snapshot?.parsed ?? {}
  const displayName =
    pickParsed(parsed, 'Hostname', 'hostname', 'ServerName') || snapshot?.server_name || siteServerName

  const uptimeRaw = pickParsed(parsed, 'Uptime', 'uptime')
  const uptimeLabel = useMemo(() => {
    if (!uptimeRaw) return '—'
    const n = parseNumberLoose(uptimeRaw)
    if (n != null && n >= 60) {
      return formatUptimeSeconds(n)
    }
    return uptimeRaw
  }, [uptimeRaw])

  const mapName = pickParsed(parsed, 'Map', 'Level', 'World') || '—'
  const players = pickParsed(parsed, 'Players', 'players') ?? '0'
  const maxPl = pickParsed(parsed, 'MaxPlayers', 'maxplayers') ?? '?'
  const fps = pickParsed(parsed, 'Framerate', 'framerate', 'FPS', 'fps') || '—'
  const entities = pickParsed(parsed, 'EntityCount', 'entitycount', 'Entities', 'entities') || '—'

  useEffect(() => {
    if (!snapshot?.parsed) return
    const fpsN = parseNumberLoose(pickParsed(snapshot.parsed, 'Framerate', 'framerate', 'FPS', 'fps'))
    const entN = parseNumberLoose(
      pickParsed(snapshot.parsed, 'EntityCount', 'entitycount', 'Entities', 'entities')
    )
    const netIn = parseNumberLoose(pickParsed(snapshot.parsed, 'NetworkIn', 'networkin'))
    const netOut = parseNumberLoose(pickParsed(snapshot.parsed, 'NetworkOut', 'networkout'))
    if (fpsN == null && entN == null && netIn == null && netOut == null) return
    setPerfHistory((h) => {
      const nextSeq = h.length ? (h[h.length - 1]?.seq ?? 0) + 1 : 0
      const next: PerfPoint = {
        seq: nextSeq,
        at: Date.now(),
        fps: fpsN,
        entities: entN,
        netIn,
        netOut,
      }
      return [...h.slice(-(MAX_PERF_POINTS - 1)), next]
    })
  }, [snapshot])

  const commandMutation = useMutation({
    mutationFn: async (command: string) => {
      const res = await fetch(backendApi(`admin/servers/${encodeURIComponent(serverId)}/rcon/command`), {
        method: 'POST',
        credentials: 'include',
        headers: authHeadersJson(),
        body: JSON.stringify({ command }),
      })
      const json = (await res.json().catch(() => ({}))) as { output?: string; error?: string; message?: string }
      if (!res.ok) {
        throw new Error(json.error || json.message || `Failed (${res.status})`)
      }
      return json.output ?? ''
    },
    onSuccess: (output, command) => {
      setConsoleLog((lines) => [...lines, `> ${command}`, output || '(no output)'])
      void queryClient.invalidateQueries({ queryKey: ['admin-server-rcon-snapshot', serverId] })
    },
    onError: (e: Error) => {
      toast.error(e.message)
      setConsoleLog((lines) => [...lines, `Error: ${e.message}`])
    },
  })

  const sendChat = useCallback(() => {
    const msg = chatInput.trim()
    if (!msg) return
    const command = `say ${JSON.stringify(msg)}`
    setChatInput('')
    commandMutation.mutate(command, {
      onSuccess: () => toast.success('Message broadcast to server'),
    })
  }, [chatInput, commandMutation])

  const runConsole = useCallback(() => {
    const cmd = consoleInput.trim()
    if (!cmd) return
    setConsoleInput('')
    commandMutation.mutate(cmd)
  }, [consoleInput, commandMutation])

  const statColumns = useMemo(() => {
    const entries = Object.entries(parsed).sort(([a], [b]) => a.localeCompare(b))
    return splitIntoColumns(entries, 3)
  }, [parsed])

  const perfChartData = useMemo(
    () =>
      perfHistory.map((p) => ({
        ...p,
        t: new Date(p.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      })),
    [perfHistory]
  )

  const hasPerfChart = perfHistory.length >= 2 && perfHistory.some((p) => p.fps != null || p.entities != null)
  const hasNetChart = perfHistory.length >= 2 && perfHistory.some((p) => p.netIn != null || p.netOut != null)

  return (
    <div className="overflow-hidden rounded-xl border border-blue-500/25 bg-zinc-950 text-zinc-100 shadow-lg">
      <header className="flex flex-wrap items-center gap-3 border-b border-blue-500/20 bg-blue-600 px-4 py-3 text-white">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">{displayName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-blue-50/95">
          <span title="Uptime">{uptimeLabel}</span>
          <span title="Map">{mapName}</span>
          <span title="Players">
            {players}/{maxPl}
          </span>
          <span title="FPS">{typeof fps === 'string' ? `${fps} fps` : fps}</span>
          <span title="Entities">{entities} ent</span>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20"
            asChild
          >
            <Link href={`https://www.battlemetrics.com/servers/rust/${encodeURIComponent(serverId)}`} target="_blank">
              <ExternalLink className="mr-1 h-3.5 w-3.5" />
              BM
            </Link>
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={() => router.push('/admin/servers')}>
            Disconnect
          </Button>
        </div>
      </header>

      <div className="flex min-h-[560px] flex-col md:flex-row">
        <nav className="flex border-b border-zinc-800 md:w-44 md:flex-col md:border-b-0 md:border-r md:border-zinc-800">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'px-4 py-3 text-left text-sm font-medium transition-colors md:border-l-2 md:border-transparent',
                tab === item.id
                  ? 'bg-blue-600/20 text-blue-300 md:border-l-blue-500'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className="flex-1 bg-zinc-950 p-4">
          {snapshotQuery.isLoading && (
            <p className="text-zinc-500 text-sm">Connecting to RCON…</p>
          )}

          {snapshotQuery.isError && (
            <Alert variant="destructive" className="mb-4 border-red-900 bg-red-950/40">
              <AlertTitle>RCON unavailable</AlertTitle>
              <AlertDescription className="space-y-2">
                <p className="whitespace-pre-wrap break-words font-mono text-xs">
                  {snapshotQuery.error instanceof Error ? snapshotQuery.error.message : 'Unknown error'}
                </p>
                <p className="text-muted-foreground text-xs">
                  Same protocol as{' '}
                  <a
                    className="text-blue-300 underline"
                    href="https://github.com/Facepunch/webrcon/tree/gh-pages"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facepunch webrcon (gh-pages)
                  </a>
                  : WebRCON over plain <code className="rounded bg-black/30 px-1">ws://</code> from this app’s API to the game,
                  then legacy TCP RCON. Loading this admin over HTTPS does not block that — only the server running PHP
                  must reach the RCON host:port. Optional env: <code className="rounded bg-black/30 px-1">RUST_RCON_WEB_ORIGIN</code>
                  ; <code className="rounded bg-black/30 px-1">RUST_RCON_WEB_USE_TLS</code> only if the game uses{' '}
                  <code className="rounded bg-black/30 px-1">wss://</code> (rare).
                </p>
              </AlertDescription>
            </Alert>
          )}

          {snapshot?.command_errors && Object.keys(snapshot.command_errors).length > 0 && (
            <Alert className="mb-4 border-amber-800 bg-amber-950/30">
              <AlertTitle className="text-amber-200">Some commands failed</AlertTitle>
              <AlertDescription className="font-mono text-xs text-amber-100/90">
                {Object.entries(snapshot.command_errors).map(([k, v]) => (
                  <div key={k}>
                    {k}: {v}
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {tab === 'server' && snapshot && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Server</h2>
                <p className="text-zinc-500 text-sm">Live fields from `serverinfo` (and similar) when the game exposes them.</p>
              </div>

              {Object.keys(parsed).length === 0 ? (
                <Card className="border-zinc-800 bg-zinc-900/40">
                  <CardHeader>
                    <CardTitle className="text-base text-zinc-200">No structured stats</CardTitle>
                    <CardDescription className="text-zinc-500">
                      The server did not return recognizable Key: Value lines. Raw output is below — use the Console tab to run
                      commands manually.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-64 overflow-auto rounded-md border border-zinc-800 bg-black/40 p-3 font-mono text-xs text-zinc-300">
                      {snapshot.raw?.serverinfo || '(empty)'}
                    </pre>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  {statColumns.map((col, i) => (
                    <div key={i} className="space-y-2 font-mono text-xs">
                      {col.map(([k, v]) => (
                        <div key={k} className="flex flex-col gap-0.5 border-b border-zinc-800/80 py-2">
                          <span className="text-zinc-500">{k}</span>
                          <span className="break-all text-zinc-200">{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-zinc-100">Server performance</CardTitle>
                    <CardDescription className="text-zinc-500">Framerate &amp; entities (from polled serverinfo)</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[220px] pt-0">
                    {hasPerfChart ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={perfChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="t" tick={{ fill: '#71717a', fontSize: 10 }} interval="preserveStartEnd" />
                          <YAxis yAxisId="left" tick={{ fill: '#71717a', fontSize: 10 }} width={36} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#71717a', fontSize: 10 }} width={36} />
                          <Tooltip
                            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }}
                            labelStyle={{ color: '#a1a1aa' }}
                          />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="fps"
                            name="Framerate"
                            stroke="#f87171"
                            dot={false}
                            strokeWidth={2}
                            connectNulls
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="entities"
                            name="Entities"
                            stroke="#4ade80"
                            dot={false}
                            strokeWidth={2}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-zinc-500 flex h-full items-center justify-center text-sm">
                        Waiting for numeric Framerate / EntityCount in serverinfo…
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-zinc-100">Server networking</CardTitle>
                    <CardDescription className="text-zinc-500">NetworkIn / NetworkOut when reported</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[220px] pt-0">
                    {hasNetChart ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={perfChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="t" tick={{ fill: '#71717a', fontSize: 10 }} interval="preserveStartEnd" />
                          <YAxis tick={{ fill: '#71717a', fontSize: 10 }} width={40} />
                          <Tooltip
                            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }}
                            labelStyle={{ color: '#a1a1aa' }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="netIn"
                            name="IN"
                            stroke="#60a5fa"
                            dot={false}
                            strokeWidth={2}
                            connectNulls
                          />
                          <Line
                            type="monotone"
                            dataKey="netOut"
                            name="OUT"
                            stroke="#93c5fd"
                            dot={false}
                            strokeWidth={2}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-zinc-500 flex h-full items-center justify-center text-sm">
                        Waiting for NetworkIn / NetworkOut in serverinfo…
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {tab === 'console' && (
            <div className="flex h-[min(70vh,560px)] flex-col gap-3">
              <div className="flex items-center gap-2 text-zinc-200">
                <Terminal className="h-4 w-4" />
                <h2 className="text-lg font-semibold">Console</h2>
              </div>
              <ScrollArea className="min-h-0 flex-1 rounded-md border border-zinc-800 bg-black/50 p-3">
                <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap">
                  {consoleLog.length === 0 ? 'Run a command below. Output from the game server appears here.' : consoleLog.join('\n')}
                </pre>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={consoleInput}
                  onChange={(e) => setConsoleInput(e.target.value)}
                  placeholder="e.g. status, server.save, users"
                  className="border-zinc-700 bg-zinc-900 font-mono text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runConsole()
                  }}
                />
                <Button type="button" onClick={runConsole} disabled={commandMutation.isPending}>
                  <Send className="mr-1 h-4 w-4" />
                  Run
                </Button>
              </div>
            </div>
          )}

          {tab === 'chat' && (
            <div className="mx-auto max-w-lg space-y-4">
              <h2 className="text-lg font-semibold text-zinc-100">Chat</h2>
              <p className="text-zinc-500 text-sm">
                Sends a server broadcast using the <code className="rounded bg-zinc-900 px-1">say</code> command. Incoming player
                chat is not available over plain RCON.
              </p>
              <div className="space-y-2">
                <Label className="text-zinc-300">Message</Label>
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  rows={3}
                  className="border-zinc-700 bg-zinc-900"
                  placeholder="Message to all players"
                />
              </div>
              <Button type="button" onClick={sendChat} disabled={commandMutation.isPending || !chatInput.trim()}>
                Send to server
              </Button>
            </div>
          )}

          {tab === 'players' && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-100">Player list</h2>
              <p className="text-zinc-500 text-sm">Output of the `status` command (refreshed with the server tab poll).</p>
              <ScrollArea className="h-[min(60vh,480px)] rounded-md border border-zinc-800 bg-black/40 p-3">
                <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap">
                  {snapshot?.raw?.status || (snapshotQuery.isLoading ? 'Loading…' : '—')}
                </pre>
              </ScrollArea>
            </div>
          )}
        </main>
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-500">
        <Button variant="ghost" size="sm" className="h-8 text-zinc-400" asChild>
          <Link href="/admin/servers">
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Server management
          </Link>
        </Button>
        <span>
          Snapshot every {SNAPSHOT_MS / 1000}s · {siteServerName} · RCON is proxied server-side (plain ws:// to Rust is
          expected)
        </span>
      </footer>
    </div>
  )
}
