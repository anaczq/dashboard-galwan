import { Suspense, lazy, useState } from "react"
import { FileText, Plus, ShieldCheck, ShieldOff, UserCog, Users as UsersIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { useUsers } from "@/hooks/useUsers"
import { AREAS, AREA_SLUGS } from "@/lib/permissions"
import type { AreaSlug, UserRole } from "@/lib/permissions"
import type { UserProfile } from "@/services/users"
import { createUserSchema } from "@/schemas/user"
import type { CreateUserInput } from "@/schemas/user"

const LogsPanel = lazy(() => import("@/components/usuarios/LogsPanel"))

export function Usuarios() {
  const { users, isLoading, isError, updatePermissions, toggleActive, updateRole, inviteUser } = useUsers()
  const [editing, setEditing] = useState<UserProfile | null>(null)
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState<"usuarios" | "logs">("usuarios")

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(value) => setTab(value as "usuarios" | "logs")}>
        <TabsList>
          <TabsTrigger value="usuarios">
            <UserCog className="size-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="size-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <UsersTab
            users={users}
            isLoading={isLoading}
            isError={isError}
            onCreate={() => setCreating(true)}
            onToggleActive={(userId, isActive) =>
              toggleActive.mutate({ userId, isActive })
            }
            onChangeRole={(userId, role) =>
              updateRole.mutate({ userId, role })
            }
            onEditPermissions={setEditing}
            isToggling={toggleActive.isPending}
            isUpdatingRole={updateRole.isPending}
          />
        </TabsContent>

        <TabsContent value="logs">
          <Suspense fallback={<LoadingState message="Carregando logs..." />}>
            <LogsPanel />
          </Suspense>
        </TabsContent>
      </Tabs>

      <CreateUserDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSave={(input) =>
          inviteUser.mutate(input, { onSuccess: () => setCreating(false) })
        }
        isPending={inviteUser.isPending}
      />

      <PermissionsDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSave={(permittedAreas) => {
          if (!editing) return
          updatePermissions.mutate(
            { userId: editing.id, permittedAreas },
            { onSuccess: () => setEditing(null) },
          )
        }}
        isPending={updatePermissions.isPending}
      />
    </div>
  )
}

interface UsersTabProps {
  users: UserProfile[]
  isLoading: boolean
  isError: boolean
  onCreate: () => void
  onToggleActive: (userId: string, isActive: boolean) => void
  onChangeRole: (userId: string, role: UserRole) => void
  onEditPermissions: (user: UserProfile) => void
  isToggling: boolean
  isUpdatingRole: boolean
}

const UsersTab = ({
  users,
  isLoading,
  isError,
  onCreate,
  onToggleActive,
  onChangeRole,
  onEditPermissions,
  isToggling,
  isUpdatingRole,
}: UsersTabProps) => {
  if (isLoading) return <LoadingState message="Carregando usuários..." />
  if (isError) return <ErrorState error="Não foi possível carregar usuários." />

  return (
    <Card className="overflow-hidden rounded-xl border-0 shadow">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-primary to-secondary px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <UserCog className="size-5 text-primary-foreground" />
          <CardTitle className="p-0 text-lg text-primary-foreground">
            Gestão de Usuários
          </CardTitle>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onCreate}
          className="gap-2"
        >
          <Plus className="size-4" />
          Novo Usuário
        </Button>
      </div>
      <CardContent className="p-0">
        {users.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={UsersIcon}
              title="Nenhum usuário cadastrado"
              description="Clique em Novo Usuário para adicionar o primeiro colaborador."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Áreas</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <UserRowItem
                  key={u.id}
                  user={u}
                  onToggleActive={(value) => onToggleActive(u.id, value)}
                  onChangeRole={(value) => onChangeRole(u.id, value)}
                  onEditPermissions={() => onEditPermissions(u)}
                  isToggling={isToggling}
                  isUpdatingRole={isUpdatingRole}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

interface UserRowItemProps {
  user: UserProfile
  onToggleActive: (value: boolean) => void
  onChangeRole: (value: UserRole) => void
  onEditPermissions: () => void
  isToggling: boolean
  isUpdatingRole: boolean
}

const UserRowItem = ({
  user,
  onToggleActive,
  onChangeRole,
  onEditPermissions,
  isToggling,
  isUpdatingRole,
}: UserRowItemProps) => {
  const isAdmin = user.role === "admin"
  const [confirmDowngrade, setConfirmDowngrade] = useState(false)

  const handleRoleChange = (value: UserRole) => {
    if (user.role === "admin" && value === "colaborador") {
      setConfirmDowngrade(true)
      return
    }
    onChangeRole(value)
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{user.email ?? "—"}</TableCell>
      <TableCell>
        <Select
          value={user.role}
          onValueChange={(value) => handleRoleChange(value as UserRole)}
          disabled={isUpdatingRole}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="colaborador">Colaborador</SelectItem>
          </SelectContent>
        </Select>
        <ConfirmDialog
          open={confirmDowngrade}
          onOpenChange={setConfirmDowngrade}
          title="Rebaixar para colaborador?"
          description={`${user.email ?? "Este usuário"} vai perder acesso irrestrito e passará a depender das áreas permitidas. Tem certeza?`}
          confirmLabel="Rebaixar"
          variant="destructive"
          onConfirm={() => {
            setConfirmDowngrade(false)
            onChangeRole("colaborador")
          }}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={user.isActive}
            onCheckedChange={onToggleActive}
            disabled={isToggling || isAdmin}
          />
          {isAdmin || user.isActive ? (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="size-3" /> ativo
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <ShieldOff className="size-3" /> inativo
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        {isAdmin ? (
          <Badge variant="outline">Acesso total</Badge>
        ) : user.permittedAreas.length === 0 ? (
          <span className="text-sm text-muted-foreground">Nenhuma área</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {user.permittedAreas.map((slug) => (
              <Badge key={slug} variant="outline">
                {AREAS[slug].label}
              </Badge>
            ))}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={onEditPermissions}
          disabled={isAdmin}
        >
          Permissões
        </Button>
      </TableCell>
    </TableRow>
  )
}

interface PermissionsDialogProps {
  user: UserProfile | null
  onClose: () => void
  onSave: (permittedAreas: AreaSlug[]) => void
  isPending: boolean
}

const PermissionsDialog = ({ user, onClose, onSave, isPending }: PermissionsDialogProps) => (
  <Dialog open={Boolean(user)} onOpenChange={(next) => { if (!next) onClose() }}>
    {user ? (
      <PermissionsDialogContent
        key={user.id}
        user={user}
        onClose={onClose}
        onSave={onSave}
        isPending={isPending}
      />
    ) : null}
  </Dialog>
)

interface PermissionsDialogContentProps {
  user: UserProfile
  onClose: () => void
  onSave: (permittedAreas: AreaSlug[]) => void
  isPending: boolean
}

const PermissionsDialogContent = ({
  user,
  onClose,
  onSave,
  isPending,
}: PermissionsDialogContentProps) => {
  const [selected, setSelected] = useState<Set<AreaSlug>>(() => new Set(user.permittedAreas))

  const toggle = (slug: AreaSlug) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  return (
    <DialogContent
      withGradientHeader
      className="mx-auto flex max-h-[calc(100vh-32px)] w-[calc(100%-32px)] max-w-md flex-col overflow-hidden p-0 sm:max-h-[85vh]"
    >
      <div className="shrink-0 rounded-t-xl bg-gradient-to-r from-primary to-secondary px-6 pb-4 pt-6">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">Permissões</DialogTitle>
          <DialogDescription className="text-primary-foreground/80">
            {user.email ?? ""}
          </DialogDescription>
        </DialogHeader>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {AREA_SLUGS.map((slug) => (
          <Label
            key={slug}
            htmlFor={`area-${slug}`}
            className="flex cursor-pointer items-center justify-between rounded-md border border-border p-3"
          >
            <div>
              <p className="text-sm font-medium">{AREAS[slug].label}</p>
              <p className="text-xs text-muted-foreground">
                {AREAS[slug].description}
              </p>
            </div>
            <Checkbox
              id={`area-${slug}`}
              checked={selected.has(slug)}
              onCheckedChange={() => toggle(slug)}
            />
          </Label>
        ))}
      </div>
      <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          onClick={() => onSave(Array.from(selected))}
          disabled={isPending}
        >
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

interface CreateUserDialogProps {
  open: boolean
  onClose: () => void
  onSave: (input: CreateUserInput) => void
  isPending: boolean
}

const CreateUserDialog = ({ open, onClose, onSave, isPending }: CreateUserDialogProps) => (
  <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
    {open ? (
      <CreateUserDialogContent onClose={onClose} onSave={onSave} isPending={isPending} />
    ) : null}
  </Dialog>
)

interface CreateUserDialogContentProps {
  onClose: () => void
  onSave: (input: CreateUserInput) => void
  isPending: boolean
}

const CreateUserDialogContent = ({ onClose, onSave, isPending }: CreateUserDialogContentProps) => {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("colaborador")
  const [selectedAreas, setSelectedAreas] = useState<Set<AreaSlug>>(new Set())
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"email" | "permittedAreas", string>>>({})

  const toggleArea = (slug: AreaSlug) => {
    setSelectedAreas((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const handleSubmit = () => {
    const result = createUserSchema.safeParse({
      email,
      role,
      permittedAreas: Array.from(selectedAreas),
    })

    if (!result.success) {
      const errors: Partial<Record<"email" | "permittedAreas", string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]
        if (key === "email" || key === "permittedAreas") {
          errors[key] = issue.message
        }
      }
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    onSave(result.data)
  }

  return (
    <DialogContent
      withGradientHeader
      className="mx-auto flex max-h-[calc(100vh-32px)] w-[calc(100%-32px)] max-w-md flex-col overflow-hidden p-0 sm:max-h-[85vh]"
    >
      <div className="shrink-0 rounded-t-xl bg-gradient-to-r from-primary to-secondary px-6 pb-4 pt-6">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">Novo Usuário</DialogTitle>
          <DialogDescription className="text-primary-foreground/80">
            O usuário vai receber um e-mail com o link para criar a própria senha
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="new-user-email">E-mail</Label>
          <Input
            id="new-user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@empresa.com"
            autoComplete="off"
            disabled={isPending}
          />
          {fieldErrors.email ? (
            <p className="text-xs text-destructive">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-user-role">Perfil</Label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as UserRole)}
            disabled={isPending}
          >
            <SelectTrigger id="new-user-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="colaborador">Colaborador</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {role === "colaborador" ? (
          <div className="space-y-2">
            <Label>Áreas permitidas</Label>
            <div className="space-y-2">
              {AREA_SLUGS.map((slug) => (
                <Label
                  key={slug}
                  htmlFor={`new-area-${slug}`}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{AREAS[slug].label}</p>
                    <p className="text-xs text-muted-foreground">
                      {AREAS[slug].description}
                    </p>
                  </div>
                  <Checkbox
                    id={`new-area-${slug}`}
                    checked={selectedAreas.has(slug)}
                    onCheckedChange={() => toggleArea(slug)}
                    disabled={isPending}
                  />
                </Label>
              ))}
            </div>
            {fieldErrors.permittedAreas ? (
              <p className="text-xs text-destructive">{fieldErrors.permittedAreas}</p>
            ) : null}
          </div>
        ) : (
          <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            Administradores têm acesso irrestrito a todas as áreas.
          </p>
        )}
      </div>

      <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar convite"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export default Usuarios
