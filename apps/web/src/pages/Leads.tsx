import { useMemo, useState } from "react"
import { Search, Users, CalendarCheck, FolderOpen, Trash2, Loader2, Pencil } from "lucide-react"
import { endOfWeek, format, isWithinInterval, parseISO, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { PaginationControls } from "@/components/shared/PaginationControls"
import { SkeletonCard, SkeletonTable } from "@/components/shared/SkeletonCard"
import { useLeads } from "@/hooks/useLeads"
import type { Lead } from "@/hooks/useLeads"
const ITEMS_PER_PAGE = 10

export function Leads() {
  const { leads, isLoading, isError, error, refetch, deleteLead, updateLead } = useLeads()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    agreed_terms: false,
    is_active: false,
    request_notes: "",
  })


  const weekLeadsCount = useMemo(() => {
    const now = new Date()
    const interval = {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    }
    return leads.filter((lead) => {
      if (!lead.created_at) return false
      try {
        return isWithinInterval(parseISO(lead.created_at), interval)
      } catch {
        return false
      }
    }).length
  }, [leads])

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.whatsapp?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    return matchesSearch
  })

  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async () => {
    if (!leadToDelete) return

    try {
      await deleteLead.mutateAsync(leadToDelete.id)
      toast.success("Lead deletado com sucesso!")
      setLeadToDelete(null)
      if (selectedLead?.id === leadToDelete.id) {
        setSelectedLead(null)
      }
    } catch {
      // erro já tratado no hook
    }
  }

  const handleStartEdit = () => {
    if (selectedLead) {
      setEditForm({
        agreed_terms: selectedLead.agreed_terms ?? false,
        is_active: selectedLead.is_active ?? false,
        request_notes: selectedLead.request_notes ?? "",
      })
      setIsEditing(true)
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedLead) return

    try {
      await updateLead.mutateAsync({
        id: selectedLead.id,
        agreed_terms: editForm.agreed_terms,
        is_active: editForm.is_active,
        request_notes: editForm.request_notes || null,
      })
      setSelectedLead({
        ...selectedLead,
        agreed_terms: editForm.agreed_terms,
        is_active: editForm.is_active,
        request_notes: editForm.request_notes || null,
      })
      setIsEditing(false)
    } catch {
      // erro já tratado no hook
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SkeletonCard variant="dashboard" />
          <SkeletonCard variant="dashboard" />
        </div>
        <Card className="overflow-hidden rounded-xl border-0 p-6 shadow">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl">Lista de Leads</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <SkeletonTable />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError) {
    return <ErrorState error={error} title="Erro ao carregar leads" onRetry={refetch} />
  }

  return (
    <>
      <div className="space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="group overflow-hidden rounded-xl border-0 bg-card p-6 shadow transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Leads Atendidos</CardTitle>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-4xl font-bold tracking-tight text-foreground">{leads.length}</div>
              <p className="mt-2 text-sm text-muted-foreground">Total de leads</p>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden rounded-xl border-0 bg-card p-6 shadow transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Atendidos na Semana</CardTitle>
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <CalendarCheck className="size-5" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-4xl font-bold tracking-tight text-foreground">{weekLeadsCount}</div>
              <p className="mt-2 text-sm text-muted-foreground">Leads desta semana (seg a dom)</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Tabela */}
        <Card className="overflow-hidden rounded-xl border-0 shadow">
          <div className="bg-gradient-to-r from-primary to-secondary p-4">
            <CardTitle className="p-0 text-xl text-primary-foreground">Lista de Leads</CardTitle>
          </div>
          <CardHeader className="p-0 px-0 pb-4 pt-4">
            <div className="flex flex-col gap-4 px-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou WhatsApp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 px-6 pb-6">
            {paginatedLeads.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="Nenhum lead encontrado"
                description="Não há leads que correspondam aos filtros selecionados."
              />
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl shadow">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Nome</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Termos</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLeads.map((lead) => (
                        <TableRow key={lead.id} className="transition-colors hover:bg-accent/15">
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>{lead.whatsapp || "-"}</TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                lead.agreed_terms
                                  ? "bg-green-500/10 text-green-600"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {lead.agreed_terms ? "Sim" : "Não"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                lead.is_active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {lead.is_active ? "Sim" : "Não"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLead(lead)}>
                              Ver detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes / Edição */}
      <Dialog
        open={!!selectedLead}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLead(null)
            setIsEditing(false)
          }
        }}
      >
        <DialogContent
          withGradientHeader
          className="mx-auto flex max-h-[calc(100vh-48px)] w-[calc(100%-48px)] max-w-lg flex-col overflow-hidden p-0 sm:max-h-[85vh] sm:max-w-xl"
        >
          <div className="shrink-0 rounded-t-xl bg-gradient-to-r from-primary to-secondary px-6 pb-4 pt-6 sm:px-10">
            <DialogHeader>
              <DialogTitle className="text-primary-foreground">
                {isEditing ? "Editar Lead" : "Detalhes do Lead"}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                {isEditing ? "Edite os campos permitidos" : "Informações completas sobre o contato"}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4 sm:px-10">
            {selectedLead && (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Nome</Label>
                  <p className="mt-1 text-base font-semibold">{selectedLead.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">WhatsApp</Label>
                  <p className="mt-1 text-base">{selectedLead.whatsapp || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data do Contato</Label>
                  <p className="mt-1 text-base">
                    {format(
                      parseISO(selectedLead.created_at),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR },
                    )}
                  </p>
                </div>

                {isEditing ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="edit-agreed-terms">Aceite de Termos</Label>
                      <Switch
                        id="edit-agreed-terms"
                        checked={editForm.agreed_terms}
                        onCheckedChange={(checked: boolean) =>
                          setEditForm((prev) => ({ ...prev, agreed_terms: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="edit-is-active">Ativo</Label>
                      <Switch
                        id="edit-is-active"
                        checked={editForm.is_active}
                        onCheckedChange={(checked: boolean) =>
                          setEditForm((prev) => ({ ...prev, is_active: checked }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-notes">Observações</Label>
                      <Textarea
                        id="edit-notes"
                        placeholder="Observações sobre o lead"
                        value={editForm.request_notes}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, request_notes: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Aceite de Termos</Label>
                      <p className="mt-1 text-base">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            selectedLead.agreed_terms
                              ? "bg-green-500/10 text-green-600"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {selectedLead.agreed_terms ? "Sim" : "Não"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Ativo</Label>
                      <p className="mt-1 text-base">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            selectedLead.is_active
                              ? "bg-green-500/10 text-green-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {selectedLead.is_active ? "Sim" : "Não"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Observações</Label>
                      <p className="mt-1 text-sm">
                        {selectedLead.request_notes || "—"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border px-6 py-4 sm:flex-row sm:px-10">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateLead.isPending}>
                  {updateLead.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Fechar
                </Button>
                <Button variant="secondary" className="gap-2" onClick={handleStartEdit}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2"
                  disabled={deleteLead.isPending}
                  onClick={() => {
                    setLeadToDelete(selectedLead)
                    setSelectedLead(null)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!leadToDelete}
        onOpenChange={() => setLeadToDelete(null)}
        onConfirm={handleDelete}
        title="Deletar Lead"
        description={`Tem certeza que deseja deletar o lead "${leadToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Deletar"
        variant="destructive"
      />
    </>
  )
}

export default Leads
