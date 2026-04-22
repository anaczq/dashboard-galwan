import { useState } from "react"
import { Edit, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { useAgentPrompt } from "@/hooks/useAgentPrompt"
import { ForbiddenError } from "@/lib/errors"

const promptFields = [
  { key: "identity" as const, title: "Identidade" },
  { key: "qualification_methodology" as const, title: "Metodologia de Qualificação" },
  { key: "emojis" as const, title: "Emojis" },
]

export function Prompt() {
  const { prompt, isLoading, isError, error, refetch, updatePrompt } = useAgentPrompt()
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  if (isLoading) {
    return <LoadingState message="Carregando configurações..." />
  }

  if (isError) {
    const isForbidden = error instanceof ForbiddenError
    return (
      <ErrorState
        error={error}
        title={isForbidden ? "Acesso negado" : "Erro ao carregar prompt"}
        onRetry={isForbidden ? undefined : refetch}
      />
    )
  }

  if (!prompt) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          Nenhuma configuração de prompt encontrada. Crie um registro na tabela{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">prompt</code> para começar.
        </p>
      </div>
    )
  }

  const handleEdit = (field: string) => {
    setEditingField(field)
    setEditedValues({
      ...editedValues,
      [field]: (prompt[field as keyof typeof prompt] as string) ?? "",
    })
  }

  const handleSave = () => {
    if (!editingField) return
    updatePrompt.mutate(
      {
        [editingField]: editedValues[editingField],
      },
      {
        onSuccess: () => {
          setEditingField(null)
          setEditedValues({})
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-xl font-bold sm:text-2xl">Ajuste de Prompt do Agente</h1>
        {editingField && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingField(null)
                setEditedValues({})
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={updatePrompt.isPending}
              onClick={handleSave}
              className="border-0 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow hover:opacity-90"
            >
              <Save className="mr-2 h-4 w-4" />
              {updatePrompt.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {promptFields.map((field) => {
          const value = prompt[field.key]
          const isEditing = editingField === field.key
          const displayValue = isEditing ? editedValues[field.key] : value

          return (
            <Card key={field.key} className="relative rounded-xl border-0 p-6 shadow transition-all">
              <CardHeader className="flex flex-row items-center justify-between p-0 pb-4">
                <CardTitle className="text-base">{field.title}</CardTitle>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(field.key)}
                    className="size-8 text-primary hover:bg-primary/10"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {isEditing ? (
                  <Textarea
                    value={displayValue ?? ""}
                    onChange={(e) => setEditedValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="min-h-[200px] resize-y border-2"
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {displayValue || "Não configurado"}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

    </div>
  )
}

export default Prompt
