import { ChevronDown, ChevronUp, Clock, Users, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Corretor } from "@/hooks/useCorretoresPage"
import { formatIsoDateToBr } from "@/lib/utils"

interface CorretoresBrokerListCardProps {
  viewMode: "month" | "day"
  selectedDayView: Date
  corretoresQuinzena: Corretor[]
  getCorretoresForDate: (date: Date) => Corretor[]
  expandedBrokers: Record<string, boolean>
  toggleBrokerExpanded: (id: string) => void
  onVerTodos: () => void
  onCadastrarNovo: () => void
}

export function CorretoresBrokerListCard({
  corretoresQuinzena,
  expandedBrokers,
  toggleBrokerExpanded,
  onVerTodos,
  onCadastrarNovo,
}: CorretoresBrokerListCardProps) {
  return (
    <Card className="overflow-hidden rounded-xl border-0 shadow lg:h-full lg:overflow-y-auto">
      <div className="bg-gradient-to-r from-primary to-secondary p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-foreground">Corretores da Quinzena</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onVerTodos}
              className="text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground"
            >
              <Users className="mr-1 h-4 w-4" />
              Ver todos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCadastrarNovo}
              className="text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground"
            >
              <UserPlus className="mr-1 h-4 w-4" />
              Novo
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="space-y-3 p-4">
        {corretoresQuinzena.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum corretor com disponibilidade nesta quinzena
          </p>
        ) : (
          corretoresQuinzena.map((corretor) => {
            const isExpanded = expandedBrokers[corretor.id]

            return (
              <div
                key={corretor.id}
                className="rounded-xl border p-3 shadow-sm transition-all hover:shadow-md"
                style={{ borderColor: `${corretor.calendar_color}40` }}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 text-left"
                  onClick={() => toggleBrokerExpanded(corretor.id)}
                >
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: corretor.calendar_color }} />
                  <span className="text-sm font-semibold">
                    {corretor.first_name} {corretor.last_name}
                  </span>
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    {corretor.disponibilidades.map((disp) => (
                      <div key={disp.id} className="rounded-md bg-muted/30 p-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">
                            {formatIsoDateToBr(disp.available_date)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {disp.is_available
                            ? disp.start_time && disp.end_time
                              ? `${disp.start_time} - ${disp.end_time}`
                              : "Disponível"
                            : "Indisponível"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
