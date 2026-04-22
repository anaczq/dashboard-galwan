import { useState, useMemo, useCallback } from "react"
import { toast } from "sonner"

import { formatWhatsApp, type Periodo } from "@/lib/corretores"
import type { Corretor } from "@/services/corretores"

interface BrokerForm {
  first_name: string
  last_name: string
  email: string
  whatsapp: string
  calendar_color: string
}

const EMPTY_FORM: BrokerForm = { first_name: "", last_name: "", email: "", whatsapp: "", calendar_color: "#3b82f6" }

interface UseCorretoresDialogsParams {
  corretores: Corretor[]
  createCorretorMutate: (input: BrokerForm) => void
  updateCorretorMutate: (input: { id: string } & Partial<BrokerForm>) => void
  deleteCorretorMutate: (id: string) => void
  saveAvailabilitiesDayMutate: (input: {
    broker_id: string
    available_date: string
    periodos: { start_time: string | null; end_time: string | null }[]
  }) => void
  isDateInCurrentQuinzena: (date: Date) => boolean
}

export function useCorretoresDialogs({
  corretores,
  createCorretorMutate,
  updateCorretorMutate,
  deleteCorretorMutate,
  saveAvailabilitiesDayMutate,
  isDateInCurrentQuinzena,
}: UseCorretoresDialogsParams) {
  /* ── Day dialog state ── */

  const [dayDialogOpen, setDayDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingDayBroker, setEditingDayBroker] = useState<string | null>(null)
  const [editingSchedules, setEditingSchedules] = useState<
    Record<string, { periodos: Periodo[]; observacoes: string }>
  >({})

  const handleDayClick = useCallback(
    (date: Date) => {
      setSelectedDate(date)
      setDayDialogOpen(true)
    },
    [],
  )

  /* ── Broker list state ── */

  const [expandedBrokers, setExpandedBrokers] = useState<Record<string, boolean>>({})

  const corretoresQuinzena = useMemo(() => {
    return corretores.filter((c) =>
      c.disponibilidades.some((d) => {
        try {
          const date = new Date(d.available_date + "T00:00:00")
          return isDateInCurrentQuinzena(date)
        } catch {
          return false
        }
      }),
    )
  }, [corretores, isDateInCurrentQuinzena])

  const toggleBrokerExpanded = (id: string) =>
    setExpandedBrokers((prev) => ({ ...prev, [id]: !prev[id] }))

  /* ── Broker list editing state ── */

  const [editingBroker, setEditingBroker] = useState<string | null>(null)
  const [brokerSchedules, setBrokerSchedules] = useState<
    Record<string, Record<string, { periodos: Periodo[]; observacoes: string }>>
  >({})

  const startEditingBroker = (id: string) => {
    const corretor = corretores.find((c) => c.id === id)
    if (!corretor) return
    const schedules: Record<string, { periodos: Periodo[]; observacoes: string }> = {}
    for (const d of corretor.disponibilidades) {
      if (!d.available_date) continue
      const existing = schedules[d.available_date]?.periodos ?? []
      existing.push({ horarioInicio: d.start_time ?? "", horarioFim: d.end_time ?? "" })
      schedules[d.available_date] = { periodos: existing, observacoes: "" }
    }
    setBrokerSchedules((prev) => ({ ...prev, [id]: schedules }))
    setEditingBroker(id)
  }

  const saveBrokerSchedules = (id: string) => {
    const corretor = corretores.find((c) => c.id === id)
    if (!corretor) return
    const edited = brokerSchedules[id] ?? {}
    const uniqueDates = new Set<string>()
    for (const d of corretor.disponibilidades) {
      if (d.available_date) uniqueDates.add(d.available_date)
    }
    for (const date of uniqueDates) {
      const periodos = (edited[date]?.periodos ?? []).map((p) => ({
        start_time: p.horarioInicio || null,
        end_time: p.horarioFim || null,
      }))
      saveAvailabilitiesDayMutate({
        broker_id: id,
        available_date: date,
        periodos,
      })
    }
    setEditingBroker(null)
  }

  const cancelEditingBroker = () => setEditingBroker(null)

  const updateBrokerSchedule = (
    brokerId: string,
    dateStr: string,
    field: "periodos" | "observacoes",
    value: Periodo[] | string,
  ) => {
    setBrokerSchedules((prev) => ({
      ...prev,
      [brokerId]: {
        ...prev[brokerId],
        [dateStr]: {
          ...prev[brokerId]?.[dateStr],
          [field]: value,
        },
      },
    }))
  }

  /* ── Dialogs state ── */

  const [allBrokersDialogOpen, setAllBrokersDialogOpen] = useState(false)
  const [newBrokerDialogOpen, setNewBrokerDialogOpen] = useState(false)
  const [uploadSpreadsheetDialogOpen, setUploadSpreadsheetDialogOpen] = useState(false)
  const [brokerToDelete, setBrokerToDelete] = useState<string | null>(null)
  const [selectedBrokerInfo, setSelectedBrokerInfo] = useState<string | null>(null)

  const [disponibilidadeToDelete, setDisponibilidadeToDelete] = useState<
    { broker_id: string; date: string } | null
  >(null)

  const handleDeleteDisponibilidade = () => {
    if (!disponibilidadeToDelete) return
    saveAvailabilitiesDayMutate({
      broker_id: disponibilidadeToDelete.broker_id,
      available_date: disponibilidadeToDelete.date,
      periodos: [],
    })
    setDisponibilidadeToDelete(null)
  }

  const [editingBrokerInList, setEditingBrokerInList] = useState<string | null>(null)
  const [editBrokerForm, setEditBrokerForm] = useState<BrokerForm>({ ...EMPTY_FORM })
  const [newBrokerForm, setNewBrokerForm] = useState<BrokerForm>({ ...EMPTY_FORM })

  const startEditingBrokerInList = (id: string) => {
    const c = corretores.find((b) => b.id === id)
    if (!c) return
    setEditBrokerForm({
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      whatsapp: c.whatsapp,
      calendar_color: c.calendar_color,
    })
    setEditingBrokerInList(id)
  }

  const saveEditedBroker = (id: string) => {
    updateCorretorMutate({ id, ...editBrokerForm })
    setEditingBrokerInList(null)
  }

  const handleDeleteBroker = (id: string) => {
    deleteCorretorMutate(id)
    setBrokerToDelete(null)
  }

  const handleAddBroker = () => {
    if (!newBrokerForm.first_name || !newBrokerForm.last_name || !newBrokerForm.email || !newBrokerForm.whatsapp) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }
    createCorretorMutate(newBrokerForm)
    setNewBrokerDialogOpen(false)
    setNewBrokerForm({ ...EMPTY_FORM })
  }

  const handleWhatsAppChange = (value: string, isNewForm: boolean) => {
    const formatted = formatWhatsApp(value)
    if (isNewForm) {
      setNewBrokerForm((prev) => ({ ...prev, whatsapp: formatted }))
    } else {
      setEditBrokerForm((prev) => ({ ...prev, whatsapp: formatted }))
    }
  }

  return {
    dayDialog: {
      dialogOpen: dayDialogOpen,
      setDialogOpen: setDayDialogOpen,
      selectedDate,
      editingDayBroker,
      setEditingDayBroker,
      editingSchedules,
      setEditingSchedules,
    },
    handleDayClick,
    brokerList: {
      corretoresQuinzena,
      expandedBrokers,
      toggleBrokerExpanded,
      editingBroker,
      brokerSchedules,
      startEditingBroker,
      saveBrokerSchedules,
      cancelEditingBroker,
      updateBrokerSchedule,
    },
    dialogs: {
      allBrokersDialogOpen,
      setAllBrokersDialogOpen,
      newBrokerDialogOpen,
      setNewBrokerDialogOpen,
      uploadSpreadsheetDialogOpen,
      setUploadSpreadsheetDialogOpen,
      brokerToDelete,
      setBrokerToDelete,
      selectedBrokerInfo,
      setSelectedBrokerInfo,
      editingBrokerInList,
      setEditingBrokerInList,
      editBrokerForm,
      setEditBrokerForm,
      newBrokerForm,
      setNewBrokerForm,
      startEditingBrokerInList,
      saveEditedBroker,
      handleDeleteBroker,
      handleAddBroker,
      disponibilidadeToDelete,
      setDisponibilidadeToDelete,
      handleDeleteDisponibilidade,
    },
    handleWhatsAppChange,
  }
}
