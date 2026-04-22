export {
  signInWithPassword,
  signOut,
  getSession,
  onAuthStateChange,
  resetPasswordForEmail,
  getPasswordResetQuotaError,
  recordPasswordResetRequest,
  hasIncomingAuthSignal,
  updateUserPassword,
} from "./auth"
export {
  uploadProjectImage,
  deleteProjectFiles,
  deleteProjectImageRecords,
  deleteFile,
  getStoragePathFromUrl,
  generateProjectEmbedding,
  validateImageFile,
} from "./storage"

export { fetchLeads, deleteLead, updateLead } from "./leads"
export type { Lead, UpdateLeadInput } from "./leads"

export {
  fetchHallucinationAlerts,
  updateHallucinationAlert,
  deleteHallucinationAlert,
} from "./hallucination-alerts"
export type {
  HallucinationAlert,
  HallucinationAlertSeverity,
  HallucinationAlertStatus,
  UpdateHallucinationAlertInput,
} from "./hallucination-alerts"

export { fetchOrientacoes, updateOrientacao, deleteOrientacao } from "./orientacoes"
export type { Orientacao, UpdateOrientacaoInput } from "./orientacoes"

export { fetchProjects, createProject, updateProject, deleteProject } from "./projects"
export type { Project, CreateProjectInput, UpdateProjectInput } from "./projects"

export { fetchProjectImages, addProjectImage, deleteProjectImage } from "./project-images"
export type { ProjectImage, AddProjectImageInput } from "./project-images"

export { fetchAgentPrompt, updateAgentPrompt } from "./agent-prompt"
export type { AgentPrompt, UpdateAgentPromptInput } from "./agent-prompt"

export {
  fetchCorretores,
  createCorretor,
  updateCorretor,
  deleteCorretor,
  saveAvailabilitiesForDay,
  logPlanilhaCorretoresUpload,
} from "./corretores"
export type {
  Corretor,
  BrokerAvailability,
  CreateCorretorInput,
  UpdateCorretorInput,
  AvailabilityPeriod,
  SaveAvailabilitiesForDayInput,
} from "./corretores"

export { generateMetricsReport } from "./report"
export type { ReportInput } from "./report"

export { fetchLogs, logEvent, formatLogDateTime } from "./logs"
export type { LogAction, LogFeature, LogEntry, LogFilters } from "./logs"

export {
  fetchCurrentUserProfile,
  listUsers,
  updateUserPermissions,
  toggleUserActive,
  updateUserRole,
  inviteUser,
} from "./users"
export type { UserProfile, InviteUserServiceInput } from "./users"
