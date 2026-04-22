import { useCorretores } from "./useCorretores"
import { useCorretoresCalendar } from "./useCorretoresCalendar"
import { useSpreadsheetImport } from "./useSpreadsheetImport"
import { useCorretoresDialogs } from "./useCorretoresDialogs"

export type { Corretor, BrokerAvailability } from "@/services/corretores"

export function useCorretoresPage() {
  const data = useCorretores()
  const calendar = useCorretoresCalendar(data.corretores)

  const ui = useCorretoresDialogs({
    corretores: data.corretores,
    createCorretorMutate: data.createCorretorMutation.mutate,
    updateCorretorMutate: data.updateCorretorMutation.mutate,
    deleteCorretorMutate: data.deleteCorretorMutation.mutate,
    saveAvailabilitiesDayMutate: data.saveAvailabilitiesDayMutation.mutate,
    isDateInCurrentQuinzena: calendar.isDateInCurrentQuinzena,
  })

  const spreadsheet = useSpreadsheetImport(
    data.corretores,
    data.saveAvailabilitiesDayMutation,
    () => ui.dialogs.setUploadSpreadsheetDialogOpen(false),
  )

  return {
    corretores: data.corretores,
    isLoading: data.isLoading,
    error: data.error,
    isError: data.isError,
    refetch: data.refetch,
    calendar: {
      ...calendar,
      handleDayClick: ui.handleDayClick,
    },
    dayDialog: ui.dayDialog,
    brokerList: ui.brokerList,
    dialogs: {
      ...ui.dialogs,
      ...spreadsheet,
    },
    handleWhatsAppChange: ui.handleWhatsAppChange,
    saveAvailabilitiesDay: data.saveAvailabilitiesDayMutation.mutate,
  }
}
