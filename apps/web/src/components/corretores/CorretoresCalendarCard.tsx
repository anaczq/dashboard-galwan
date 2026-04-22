import { format, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Corretor } from "@/hooks/useCorretoresPage"

interface CorretoresCalendarCardProps {
  viewMode: "month" | "day"
  setViewMode: (mode: "month" | "day") => void
  currentMonth: Date
  selectedDayView: Date
  setSelectedDayView: (date: Date) => void
  selectedPeriod: string
  currentQuinzena: 1 | 2
  handlePrevPeriod: () => void
  handleNextPeriod: () => void
  handleQuinzenaSelect: (q: 1 | 2) => void
  isDateInSelectedPeriod: (date: Date) => boolean
  isDateInCurrentQuinzena: (date: Date) => boolean
  calendarDays: (Date | null)[]
  corretores: Corretor[]
  getCorretoresForDate: (date: Date) => Corretor[]
  handleDayClick: (date: Date) => void
  isCorretorAvailableAtTime: (corretorId: string, date: Date, timeSlot: string) => boolean
  onBrokerInfoClick: (id: string) => void
}

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
]

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function CorretoresCalendarCard({
  viewMode,
  currentMonth,
  selectedDayView,
  setSelectedDayView,
  currentQuinzena,
  handlePrevPeriod,
  handleNextPeriod,
  handleQuinzenaSelect,
  isDateInCurrentQuinzena,
  calendarDays,
  corretores,
  getCorretoresForDate,
  handleDayClick,
  isCorretorAvailableAtTime,
  onBrokerInfoClick,
}: CorretoresCalendarCardProps) {
  if (viewMode === "day") {
    return (
      <Card className="overflow-hidden rounded-xl border-0 shadow lg:h-full lg:overflow-y-auto">
        <div className="bg-gradient-to-r from-primary to-secondary p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setSelectedDayView(new Date(selectedDayView.getTime() - 86400000))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-primary-foreground">
              {format(selectedDayView, "dd 'de' MMMM, yyyy - EEEE", { locale: ptBR })}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setSelectedDayView(new Date(selectedDayView.getTime() + 86400000))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="space-y-1">
            {TIME_SLOTS.map((slot) => {
              const availableBrokers = corretores.filter((c) =>
                isCorretorAvailableAtTime(c.id, selectedDayView, slot),
              )
              return (
                <div
                  key={slot}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleDayClick(selectedDayView)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleDayClick(selectedDayView)
                    }
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-muted/50"
                >
                  <span className="w-12 text-xs font-medium text-muted-foreground">{slot}</span>
                  <div className="flex flex-1 flex-wrap gap-1">
                    {availableBrokers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: `${c.calendar_color}20`, color: c.calendar_color }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onBrokerInfoClick(c.id)
                        }}
                      >
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.calendar_color }} />
                        {c.first_name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden rounded-xl border-0 shadow lg:h-full lg:overflow-y-auto">
      <div className="bg-gradient-to-r from-primary to-secondary p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handlePrevPeriod}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-primary-foreground">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handleNextPeriod}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 flex justify-center gap-2">
          <Button
            variant={currentQuinzena === 1 ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleQuinzenaSelect(1)}
            className={cn(
              "text-xs",
              currentQuinzena !== 1 && "text-primary-foreground/70 hover:bg-primary-foreground/20",
            )}
          >
            1ª Quinzena
          </Button>
          <Button
            variant={currentQuinzena === 2 ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleQuinzenaSelect(2)}
            className={cn(
              "text-xs",
              currentQuinzena !== 2 && "text-primary-foreground/70 hover:bg-primary-foreground/20",
            )}
          >
            2ª Quinzena
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="p-1 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {calendarDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="aspect-square" />
            const dayCorretores = getCorretoresForDate(date)
            const inQuinzena = isDateInCurrentQuinzena(date)
            const today = isToday(date)

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => handleDayClick(date)}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-start gap-0.5 rounded-lg p-1 text-xs transition-colors hover:bg-accent/30",
                  !inQuinzena && "opacity-40",
                  today && "ring-2 ring-primary",
                )}
              >
                <span className={cn("font-medium", today && "text-primary")}>{format(date, "d")}</span>
                {dayCorretores.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-0.5">
                    {dayCorretores.slice(0, 3).map((c) => (
                      <div
                        key={c.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: c.calendar_color }}
                      />
                    ))}
                    {dayCorretores.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">+{dayCorretores.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
