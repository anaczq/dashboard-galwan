import { useState, useMemo, useCallback } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns"

import type { Corretor } from "@/services/corretores"

export function useCorretoresCalendar(corretores: Corretor[]) {
  const [viewMode, setViewMode] = useState<"month" | "day">("month")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDayView, setSelectedDayView] = useState(new Date())
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "quinzena">("month")
  const [currentQuinzena, setCurrentQuinzena] = useState<1 | 2>(1)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const padStart = getDay(monthStart)
    const paddedDays: (Date | null)[] = Array.from<null>({ length: padStart }).fill(null)
    return [...paddedDays, ...days]
  }, [monthStart, monthEnd])

  const handlePrevPeriod = () => setCurrentMonth((m) => subMonths(m, 1))
  const handleNextPeriod = () => setCurrentMonth((m) => addMonths(m, 1))
  const handleQuinzenaSelect = (q: 1 | 2) => {
    setCurrentQuinzena(q)
    setSelectedPeriod("quinzena")
  }

  const isDateInSelectedPeriod = useCallback(
    (date: Date) => {
      if (selectedPeriod === "month") {
        return isWithinInterval(date, { start: monthStart, end: monthEnd })
      }
      const qStart = currentQuinzena === 1 ? monthStart : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 16)
      const qEnd = currentQuinzena === 1 ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15) : monthEnd
      return isWithinInterval(date, { start: startOfDay(qStart), end: endOfDay(qEnd) })
    },
    [selectedPeriod, currentQuinzena, monthStart, monthEnd, currentMonth],
  )

  const isDateInCurrentQuinzena = useCallback(
    (date: Date) => {
      const qStart = currentQuinzena === 1 ? monthStart : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 16)
      const qEnd = currentQuinzena === 1 ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15) : monthEnd
      return isWithinInterval(date, { start: startOfDay(qStart), end: endOfDay(qEnd) })
    },
    [currentQuinzena, monthStart, monthEnd, currentMonth],
  )

  const getCorretoresForDate = useCallback(
    (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      return corretores.filter((c) => c.disponibilidades.some((d) => d.available_date === dateStr))
    },
    [corretores],
  )

  const isCorretorAvailableAtTime = useCallback(
    (corretorId: string, date: Date, timeSlot: string) => {
      const dateStr = format(date, "yyyy-MM-dd")
      const corretor = corretores.find((c) => c.id === corretorId)
      if (!corretor) return false
      return corretor.disponibilidades.some((d) => {
        if (d.available_date !== dateStr || !d.is_available) return false
        if (!d.start_time || !d.end_time) return true
        const start = d.start_time.slice(0, 5)
        const end = d.end_time.slice(0, 5)
        return timeSlot >= start && timeSlot < end
      })
    },
    [corretores],
  )

  return {
    viewMode,
    setViewMode,
    currentMonth,
    selectedDayView,
    setSelectedDayView,
    selectedPeriod,
    currentQuinzena,
    handlePrevPeriod,
    handleNextPeriod,
    handleQuinzenaSelect,
    isDateInSelectedPeriod,
    isDateInCurrentQuinzena,
    calendarDays,
    getCorretoresForDate,
    isCorretorAvailableAtTime,
    startOfMonth: monthStart,
  }
}
