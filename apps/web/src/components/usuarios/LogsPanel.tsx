import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FileText, Filter } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { useLogs } from "@/hooks/useLogs"
import type { LogAction, LogEntry, LogFeature } from "@/services/logs"

const FEATURE_LABEL: Record<LogFeature, string> = {
  prompts: "Prompt",
  projetos: "Projetos",
  corretores: "Corretores",
  chat: "Chat",
  leads: "Leads",
  metricas: "Métricas",
}

const ACTION_VARIANT: Record<LogAction, "default" | "secondary" | "destructive"> = {
  CREATE: "secondary",
  UPDATE: "default",
  DELETE: "destructive",
}

const FEATURE_FILTERS: Array<{ value: "all" | LogFeature; label: string }> = [
  { value: "all", label: "Todas as áreas" },
  { value: "prompts", label: "Prompt" },
  { value: "projetos", label: "Projetos" },
  { value: "corretores", label: "Corretores" },
  { value: "chat", label: "Chat" },
  { value: "leads", label: "Leads" },
  { value: "metricas", label: "Métricas" },
]

const ACTION_FILTERS: Array<{ value: "all" | LogAction; label: string }> = [
  { value: "all", label: "Todas as ações" },
  { value: "CREATE", label: "Criação" },
  { value: "UPDATE", label: "Alteração" },
  { value: "DELETE", label: "Exclusão" },
]

export function LogsPanel() {
  const [featureFilter, setFeatureFilter] = useState<"all" | LogFeature>("all")
  const [actionFilter, setActionFilter] = useState<"all" | LogAction>("all")

  const { data, isLoading, isError, error, refetch } = useLogs({
    feature: featureFilter === "all" ? undefined : featureFilter,
    action: actionFilter === "all" ? undefined : actionFilter,
  })

  const rows: LogEntry[] = data ?? []

  return (
    <Card className="overflow-hidden rounded-xl border-0 shadow">
      <div className="flex flex-col gap-3 bg-gradient-to-r from-primary to-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <FileText className="size-5 text-primary-foreground" />
          <CardTitle className="p-0 text-lg text-primary-foreground">Logs do Sistema</CardTitle>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={featureFilter}
            onValueChange={(value) => setFeatureFilter(value as "all" | LogFeature)}
          >
            <SelectTrigger className="w-full bg-background/95 sm:w-44">
              <div className="flex items-center gap-2">
                <Filter className="size-3.5" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {FEATURE_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={actionFilter}
            onValueChange={(value) => setActionFilter(value as "all" | LogAction)}
          >
            <SelectTrigger className="w-full bg-background/95 sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <CardContent className="p-0">
        {isLoading && (
          <div className="p-4">
            <LoadingState message="Carregando logs..." />
          </div>
        )}
        {!isLoading && isError && (
          <div className="p-4">
            <ErrorState
              error={error}
              title="Erro ao carregar logs"
              onRetry={() => void refetch()}
            />
          </div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title="Nenhum log registrado"
              description="As ações realizadas no dashboard aparecerão aqui assim que forem executadas."
            />
          </div>
        )}
        {!isLoading && !isError && rows.length > 0 && (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Data e hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="w-28">Ação</TableHead>
                <TableHead className="w-32">Área</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{log.user_email}</TableCell>
                  <TableCell>
                    <Badge variant={ACTION_VARIANT[log.action]}>{log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{FEATURE_LABEL[log.feature]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default LogsPanel
