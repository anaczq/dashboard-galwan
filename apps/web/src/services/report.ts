import type { jsPDF } from "jspdf"
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

import { supabase } from "@/integrations/supabase/client"

import type { Lead } from "./leads"
import type { HallucinationAlert } from "./hallucination-alerts"
import type { Orientacao } from "./orientacoes"
import { formatLogDateTime, logEvent } from "@/services/logs"

/* ─── Types ─── */

export interface ReportInput {
  startDate: Date
  endDate: Date
  leads: Lead[]
  alerts: HallucinationAlert[]
  orientacoes: Orientacao[]
  logoUrl: string
}

/* ─── Colors ─── */

const COLORS = {
  primaryBlue: [45, 55, 95] as [number, number, number],
  secondaryBlue: [76, 119, 158] as [number, number, number],
  accentBlue: [56, 136, 216] as [number, number, number],
  darkBlue: [30, 40, 70] as [number, number, number],
  grayBlue: [100, 116, 139] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  red: [196, 52, 43] as [number, number, number],
  orange: [249, 115, 22] as [number, number, number],
  yellow: [234, 179, 8] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightBg: [248, 250, 252] as [number, number, number],
  zebraRow: [252, 252, 254] as [number, number, number],
}

/* ─── Helpers ─── */

const getBase64FromUrl = async (url: string): Promise<string> => {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

const drawSectionTitle = (doc: jsPDF, title: string, y: number, pageWidth: number) => {
  doc.setFillColor(...COLORS.primaryBlue)
  doc.roundedRect(15, y, pageWidth - 30, 10, 2, 2, "F")
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(title, 20, y + 7)
  return y + 15
}

const drawMetricCard = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  value: string | number,
  color: [number, number, number],
) => {
  doc.setFillColor(...COLORS.lightBg)
  doc.roundedRect(x, y, width, 28, 2, 2, "F")
  doc.setFillColor(...color)
  doc.rect(x, y, 3, 28, "F")
  doc.setTextColor(...COLORS.grayBlue)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(title, x + 8, y + 10)
  doc.setTextColor(...COLORS.darkBlue)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(String(value), x + 8, y + 22)
}

/* ─── Main ─── */

export const generateMetricsReport = async (input: ReportInput): Promise<void> => {
  const { startDate, endDate, leads, alerts, orientacoes, logoUrl } = input

  const leadsInPeriod = leads.filter((lead) => {
    const leadDate = lead.created_at ? parseISO(lead.created_at) : null
    if (!leadDate) return false
    return isWithinInterval(leadDate, { start: startOfDay(startDate), end: endOfDay(endDate) })
  })

  const totalLeads = leadsInPeriod.length
  const leadsAtivos = leadsInPeriod.filter((lead) => lead.is_active).length
  const leadsAceitaramTermos = leadsInPeriod.filter((lead) => lead.agreed_terms).length

  const alertsInPeriod = alerts.filter((alert) => {
    if (!alert.created_at) return false
    try {
      const alertDate = parseISO(alert.created_at)
      return isWithinInterval(alertDate, { start: startOfDay(startDate), end: endOfDay(endDate) })
    } catch {
      return false
    }
  })

  const alertasGraves = alertsInPeriod.filter((a) => a.severity === "Alto").length
  const alertasMedios = alertsInPeriod.filter((a) => a.severity === "Médio").length
  const alertasBaixos = alertsInPeriod.filter((a) => a.severity === "Baixo").length

  const orientacoesImplementadas = orientacoes.filter((o) => o.is_resolved).length
  const orientacoesPendentes = orientacoes.filter((o) => !o.is_resolved).length

  const { jsPDF: JsPDF } = await import("jspdf")
  const doc = new JsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const addFooter = () => {
    doc.setFillColor(...COLORS.primaryBlue)
    doc.rect(0, pageHeight - 15, pageWidth, 15, "F")
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(8)
    doc.text(
      `Galwan | Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" },
    )
  }

  const checkNewPage = (requiredSpace: number, currentY: number): number => {
    if (currentY + requiredSpace > pageHeight - 25) {
      addFooter()
      doc.addPage()
      return 20
    }
    return currentY
  }

  let logoBase64 = ""
  try {
    logoBase64 = await getBase64FromUrl(logoUrl)
  } catch {
    /* logo is optional */
  }

  /* ── Page 1: Header ── */

  doc.setFillColor(...COLORS.lightBg)
  doc.rect(0, 0, pageWidth, 22, "F")
  doc.setFillColor(...COLORS.primaryBlue)
  doc.rect(0, 20, pageWidth, 2, "F")

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", 10, 2, 45, 16)
    } catch {
      /* ignore */
    }
  }

  doc.setTextColor(...COLORS.primaryBlue)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Relatório de Métricas", pageWidth - 15, 10, { align: "right" })

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.grayBlue)
  const periodoTexto = `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} a ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`
  doc.text(periodoTexto, pageWidth - 15, 18, { align: "right" })

  let yPos = 30

  /* ── Leads section ── */

  yPos = drawSectionTitle(doc, "Métricas de Leads", yPos, pageWidth)
  const cardWidth = (pageWidth - 45) / 4
  const cardGap = 5

  drawMetricCard(doc, 15, yPos, cardWidth, "Total", totalLeads, COLORS.accentBlue)
  drawMetricCard(doc, 15 + (cardWidth + cardGap) * 2, yPos, cardWidth, "Ativos", leadsAtivos, COLORS.secondaryBlue)
  drawMetricCard(doc, 15 + (cardWidth + cardGap) * 3, yPos, cardWidth, "Aceitaram Termos", leadsAceitaramTermos, COLORS.orange)
  yPos += 35


  /* ── Alerts section ── */

  yPos = drawSectionTitle(doc, "Métricas de Alertas", yPos, pageWidth)
  drawMetricCard(doc, 15, yPos, cardWidth, "Total", alertsInPeriod.length, COLORS.secondaryBlue)
  drawMetricCard(doc, 15 + (cardWidth + cardGap) * 3, yPos, cardWidth, "Graves", alertasGraves, COLORS.red)
  yPos += 35

  doc.setFillColor(...COLORS.lightBg)
  doc.roundedRect(15, yPos, pageWidth - 30, 18, 2, 2, "F")
  doc.setTextColor(...COLORS.grayBlue)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Por gravidade:", 20, yPos + 11)

  doc.setFillColor(...COLORS.red)
  doc.circle(62, yPos + 9, 4, "F")
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(7)
  doc.text(String(alertasGraves), 62, yPos + 11, { align: "center" })
  doc.setTextColor(...COLORS.darkBlue)
  doc.setFontSize(8)
  doc.text("Alto", 70, yPos + 11)

  doc.setFillColor(...COLORS.yellow)
  doc.circle(95, yPos + 9, 4, "F")
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(7)
  doc.text(String(alertasMedios), 95, yPos + 11, { align: "center" })
  doc.setTextColor(...COLORS.darkBlue)
  doc.setFontSize(8)
  doc.text("Médio", 103, yPos + 11)

  doc.setFillColor(...COLORS.accentBlue)
  doc.circle(132, yPos + 9, 4, "F")
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(7)
  doc.text(String(alertasBaixos), 132, yPos + 11, { align: "center" })
  doc.setTextColor(...COLORS.darkBlue)
  doc.setFontSize(8)
  doc.text("Baixo", 140, yPos + 11)
  yPos += 25

  /* ── Orientacoes section ── */

  yPos = drawSectionTitle(doc, "Orientações e Melhorias", yPos, pageWidth)
  const halfWidth = (pageWidth - 35) / 2
  drawMetricCard(doc, 15, yPos, halfWidth, "Implementadas", orientacoesImplementadas, COLORS.green)
  drawMetricCard(doc, 20 + halfWidth, yPos, halfWidth, "Pendentes", orientacoesPendentes, COLORS.orange)
  yPos += 35

  /* ── Alerts table page ── */

  if (alertsInPeriod.length > 0) {
    addFooter()
    doc.addPage()

    doc.setFillColor(...COLORS.lightBg)
    doc.rect(0, 0, pageWidth, 18, "F")
    doc.setFillColor(...COLORS.primaryBlue)
    doc.rect(0, 16, pageWidth, 2, "F")

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", 10, 2, 35, 12)
      } catch {
        /* ignore */
      }
    }

    doc.setTextColor(...COLORS.primaryBlue)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Alertas de alucinação", pageWidth - 15, 11, { align: "right" })
    yPos = 25

    doc.setFillColor(...COLORS.lightBg)
    doc.rect(15, yPos, pageWidth - 30, 10, "F")
    doc.setTextColor(...COLORS.darkBlue)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("Título", 20, yPos + 7)
    doc.text("Data", 60, yPos + 7)
    doc.text("Descrição", 90, yPos + 7)
    doc.text("Gravidade", 155, yPos + 7)
    yPos += 12

    alertsInPeriod.forEach((alert, index) => {
      yPos = checkNewPage(12, yPos)
      if (index % 2 === 0) {
        doc.setFillColor(...COLORS.zebraRow)
        doc.rect(15, yPos - 2, pageWidth - 30, 10, "F")
      }

      const gravColor =
        alert.severity === "Alto"
          ? COLORS.red
          : alert.severity === "Médio"
            ? COLORS.yellow
            : COLORS.accentBlue

      doc.setFillColor(...gravColor)
      doc.rect(15, yPos - 2, 2, 10, "F")

      doc.setTextColor(...COLORS.darkBlue)
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      doc.text((alert.title || "Alerta").substring(0, 15), 20, yPos + 4)
      doc.text(
        alert.created_at ? format(parseISO(alert.created_at), "dd/MM/yyyy", { locale: ptBR }) : "-",
        60,
        yPos + 4,
      )

      const desc = (alert.description || "").substring(0, 40)
      doc.text(desc + (desc.length === 40 ? "..." : ""), 90, yPos + 4)

      doc.setFillColor(...gravColor)
      doc.roundedRect(152, yPos, 20, 6, 1, 1, "F")
      doc.setTextColor(...COLORS.white)
      doc.setFontSize(6)
      doc.text(alert.severity ?? "—", 162, yPos + 4, { align: "center" })


      yPos += 10
    })
  }

  /* ── Orientacoes page ── */

  if (orientacoes.length > 0) {
    addFooter()
    doc.addPage()

    doc.setFillColor(...COLORS.lightBg)
    doc.rect(0, 0, pageWidth, 18, "F")
    doc.setFillColor(...COLORS.primaryBlue)
    doc.rect(0, 16, pageWidth, 2, "F")

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", 10, 2, 35, 12)
      } catch {
        /* ignore */
      }
    }

    doc.setTextColor(...COLORS.primaryBlue)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Orientações e Melhorias", pageWidth - 15, 11, { align: "right" })
    yPos = 25

    orientacoes.forEach((orientacao) => {
      yPos = checkNewPage(28, yPos)
      const isImplementado = orientacao.is_resolved
      const borderColor = isImplementado ? COLORS.green : COLORS.orange

      doc.setFillColor(...COLORS.lightBg)
      doc.roundedRect(15, yPos, pageWidth - 30, 24, 2, 2, "F")
      doc.setFillColor(...borderColor)
      doc.rect(15, yPos, 3, 24, "F")

      doc.setFillColor(...COLORS.secondaryBlue)
      doc.roundedRect(22, yPos + 3, 30, 6, 1, 1, "F")
      doc.setTextColor(...COLORS.white)
      doc.setFontSize(6)
      doc.text((orientacao.category || "").substring(0, 12), 37, yPos + 7, { align: "center" })

      doc.setFillColor(...borderColor)
      doc.roundedRect(pageWidth - 45, yPos + 3, 28, 6, 1, 1, "F")
      doc.text(isImplementado ? "Implementado" : "Pendente", pageWidth - 31, yPos + 7, { align: "center" })

      doc.setTextColor(...COLORS.darkBlue)
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      const descOri = (orientacao.problem_description || "").substring(0, 90)
      doc.text(descOri + (descOri.length === 90 ? "..." : ""), 22, yPos + 15, { maxWidth: pageWidth - 50 })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.grayBlue)
      const motivo = (orientacao.reason || "").substring(0, 100)
      doc.text(motivo + (motivo.length === 100 ? "..." : ""), 22, yPos + 21, { maxWidth: pageWidth - 50 })

      yPos += 27
    })
  }

  addFooter()

  const fileName = `relatorio_galwan_${format(startDate, "ddMMyyyy")}_${format(endDate, "ddMMyyyy")}.pdf`
  doc.save(fileName)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? "—"
  const when = formatLogDateTime()
  void logEvent({
    action: "CREATE",
    feature: "metricas",
    description: `O usuário ${email} baixou o relatório de métricas em ${when}.`,
  })
}
