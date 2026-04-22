import type React from "react"
import { useState } from "react"
import {
  Plus,
  Search,
  MoreVertical,
  Upload,
  X,
  CalendarIcon,
  FolderOpen,
  Loader2,
  Images,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { SkeletonTable } from "@/components/shared/SkeletonCard"
import { useProjects } from "@/hooks/useProjects"
import { useProjectImages } from "@/hooks/useProjectImages"
import { cn } from "@/lib/utils"
import {
  uploadProjectImage,
  deleteProjectFiles,
  deleteProjectImageRecords,
  deleteFile,
  getStoragePathFromUrl,
  generateProjectEmbedding,
  validateImageFile,
} from "@/services/storage"
import { ESTADOS, CIDADES_POR_ESTADO } from "@/data/brasil-localidades"
import type { Project, CreateProjectInput } from "@/hooks/useProjects"

const ITEMS_PER_PAGE = 10

const STATUS_COLORS: Record<string, string> = {
  Ativo: "bg-green-100 text-green-700",
  Inativo: "bg-gray-100 text-gray-700",
  "Disponível em breve": "bg-amber-100 text-amber-700",
}

export function Projetos() {
  const { projects, isLoading, isError, error, refetch, createProject, updateProject, deleteProject } = useProjects()
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewImagesProjectId, setViewImagesProjectId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddingImages, setIsAddingImages] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)

  const [projectName, setProjectName] = useState("")
  const [launchDate, setLaunchDate] = useState<Date>()
  const [deliveryMonthYear, setDeliveryMonthYear] = useState<{ month: number; year: number }>()
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("Vitória")
  const [estado, setEstado] = useState("ES")
  const [referencePoints, setReferencePoints] = useState("")
  const [description, setDescription] = useState("")
  const [linkSite, setLinkSite] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [status, setStatus] = useState<Project["status"]>("Ativo")

  const projectIdForImages = editMode && currentProjectId ? currentProjectId : viewImagesProjectId || ""
  const {
    images: projectImages,
    addImage,
    deleteImage: deleteProjectImage,
  } = useProjectImages(projectIdForImages)

  if (isLoading) {
    return (
      <Card className="overflow-hidden rounded-xl border-0 p-6 shadow">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xl">Projetos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SkeletonTable />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return <ErrorState error={error} title="Erro ao carregar projetos" onRetry={refetch} />
  }

  const filteredProjetos = projects.filter((projeto) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      (projeto.name || "").toLowerCase().includes(term) ||
      (projeto.neighborhood || "").toLowerCase().includes(term) ||
      (projeto.city || "").toLowerCase().includes(term) ||
      (projeto.state || "").toLowerCase().includes(term)
    const matchesStatus = statusFilter === "all" || projeto.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredProjetos.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedProjetos = filteredProjetos.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const resetForm = () => {
    setProjectName("")
    setLaunchDate(undefined)
    setDeliveryMonthYear(undefined)
    setBairro("")
    setCidade("Vitória")
    setEstado("ES")
    setReferencePoints("")
    setDescription("")
    setLinkSite("")
    imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    setImagePreviews([])
    setImages([])
    setExistingImages([])
    setStatus("Ativo")
    setEditMode(false)
    setCurrentProjectId(null)
  }

  const handleOpenNewProject = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleOpenEditProject = (project: Project) => {
    setProjectName(project.name || "")
    setLaunchDate(project.launch_date ? new Date(project.launch_date) : undefined)
    if (project.delivery_date) {
      const [y, m] = project.delivery_date.split("-")
      setDeliveryMonthYear({ year: Number(y), month: Number(m) })
    } else {
      setDeliveryMonthYear(undefined)
    }
    setBairro(project.neighborhood || "")
    setCidade(project.city || "Vitória")
    setEstado(project.state || "ES")
    setReferencePoints(project.reference_points || "")
    setDescription(project.description || "")
    setLinkSite(project.project_website || "")
    setStatus(project.status)
    setExistingImages(project.project_images_urls || [])
    setEditMode(true)
    setCurrentProjectId(project.id)
    setDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!projectToDelete) return
    try {
      await deleteProjectFiles(projectToDelete)
    } catch {
      toast.error("Não foi possível remover os arquivos do projeto. Tente novamente.")
      return
    }

    try {
      await deleteProjectImageRecords(projectToDelete)
    } catch {
      toast.error("Não foi possível remover os registros de imagens. Tente novamente.")
      return
    }

    deleteProject.mutate(projectToDelete, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setProjectToDelete(null)
      },
    })
  }

  const handleSaveProject = async () => {
    if (isSaving) return
    if (!projectName.trim()) {
      toast.error("Nome do projeto é obrigatório")
      return
    }
    setIsSaving(true)
    let imagesOnlyError = false

    try {
      const projectData = {
        name: projectName,
        launch_date: launchDate?.toISOString().split("T")[0] ?? null,
        delivery_date: deliveryMonthYear
          ? `${deliveryMonthYear.year}-${String(deliveryMonthYear.month).padStart(2, "0")}-01`
          : null,
        neighborhood: bairro || null,
        city: cidade || null,
        state: estado || null,
        reference_points: referencePoints || null,
        description: description || null,
        project_website: linkSite.trim() || null,
        status,
      }

      if (editMode && currentProjectId) {
        await updateProject.mutateAsync({
          id: currentProjectId,
          ...projectData,
          project_images_urls: existingImages.length > 0 ? existingImages : null,
        })

        generateProjectEmbedding(currentProjectId).catch(() => {
          toast.info("Projeto salvo, mas a indexação para busca não pôde ser gerada. Ela será processada automaticamente depois.")
        })

        if (images.length > 0) {
          const si = existingImages.length
          const successUrls: string[] = []
          let hadImageError = false

          for (let i = 0; i < images.length; i++) {
            let uploadedUrl: string | null = null
            try {
              uploadedUrl = await uploadProjectImage(images[i], currentProjectId, si + i)
              await addImage.mutateAsync({
                projectId: currentProjectId,
                imageUrl: uploadedUrl,
                orderIndex: si + i,
              })
              successUrls.push(uploadedUrl)
            } catch {
              hadImageError = true
              if (uploadedUrl) {
                const path = getStoragePathFromUrl(uploadedUrl, "imagens-projetos")
                if (path) deleteFile("imagens-projetos", path).catch(() => {})
              }
            }
          }

          if (successUrls.length > 0) {
            await updateProject.mutateAsync({
              id: currentProjectId,
              project_images_urls: [...existingImages, ...successUrls],
            })
          }
          if (hadImageError) {
            toast.error("Projeto atualizado, mas algumas imagens não puderam ser processadas.")
            imagesOnlyError = true
          }
        }
      } else {
        const newProject = await createProject.mutateAsync({
          ...projectData,
          project_images_urls: null,
        } as CreateProjectInput)

        if (newProject?.id) {
          generateProjectEmbedding(newProject.id).catch(() => {
            toast.info("Projeto salvo, mas a indexação para busca não pôde ser gerada. Ela será processada automaticamente depois.")
          })
        }

        if (images.length > 0 && newProject?.id) {
          const successUrls: string[] = []
          let hadImageError = false

          for (let i = 0; i < images.length; i++) {
            let uploadedUrl: string | null = null
            try {
              uploadedUrl = await uploadProjectImage(images[i], newProject.id, i)
              await addImage.mutateAsync({
                projectId: newProject.id,
                imageUrl: uploadedUrl,
                orderIndex: i,
              })
              successUrls.push(uploadedUrl)
            } catch {
              hadImageError = true
              if (uploadedUrl) {
                const path = getStoragePathFromUrl(uploadedUrl, "imagens-projetos")
                if (path) deleteFile("imagens-projetos", path).catch(() => {})
              }
            }
          }

          if (successUrls.length > 0) {
            await updateProject.mutateAsync({ id: newProject.id, project_images_urls: successUrls })
          }
          if (hadImageError) {
            toast.error("Projeto criado, mas algumas imagens não puderam ser processadas.")
            imagesOnlyError = true
          }
        }
      }

      if (!imagesOnlyError) {
        toast.success(`O projeto "${projectName}" foi ${editMode ? "atualizado" : "criado"} com sucesso.`)
      }
      resetForm()
      setDialogOpen(false)
    } catch {
      // erro já tratado no hook
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 20) {
      toast.error("Você pode adicionar no máximo 20 imagens")
      return
    }

    const validFiles: File[] = []
    for (const file of files) {
      try {
        validateImageFile(file)
        validFiles.push(file)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Arquivo inválido")
      }
    }
    if (validFiles.length === 0) return

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file))
    setImagePreviews((prev) => [...prev, ...newPreviews])
    setImages((prev) => [...prev, ...validFiles])
  }

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || [])
    if (!viewImagesProjectId || rawFiles.length === 0) return
    e.target.value = ""

    const files: File[] = []
    for (const file of rawFiles) {
      try {
        validateImageFile(file)
        files.push(file)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Arquivo inválido")
      }
    }
    if (files.length === 0) return

    setIsAddingImages(true)
    const si = projectImages.length
    const successUrls: string[] = []
    let hadError = false

    for (let i = 0; i < files.length; i++) {
      let uploadedUrl: string | null = null
      try {
        uploadedUrl = await uploadProjectImage(files[i], viewImagesProjectId, si + i)
        await addImage.mutateAsync({
          projectId: viewImagesProjectId,
          imageUrl: uploadedUrl,
          orderIndex: si + i,
        })
        successUrls.push(uploadedUrl)
      } catch {
        hadError = true
        if (uploadedUrl) {
          const path = getStoragePathFromUrl(uploadedUrl, "imagens-projetos")
          if (path) deleteFile("imagens-projetos", path).catch(() => {})
        }
      }
    }

    try {
      if (successUrls.length > 0) {
        const allUrls = [...projectImages.map((img) => img.image_url), ...successUrls]
        await updateProject.mutateAsync({ id: viewImagesProjectId, project_images_urls: allUrls })
      }
      if (hadError) toast.error("Algumas imagens não puderam ser adicionadas.")
      else toast.success("Imagens adicionadas com sucesso!")
    } catch {
      // erro já tratado no hook
    } finally {
      setIsAddingImages(false)
    }
  }

  const handleGalleryDelete = async (image: { id: string; image_url: string }) => {
    if (!viewImagesProjectId) return
    setDeletingImageId(image.id)
    try {
      const storagePath = getStoragePathFromUrl(image.image_url, "imagens-projetos")
      if (storagePath) await deleteFile("imagens-projetos", storagePath)
      await deleteProjectImage.mutateAsync(image.id)

      const remainingUrls = projectImages.filter((img) => img.id !== image.id).map((img) => img.image_url)
      await updateProject.mutateAsync({
        id: viewImagesProjectId,
        project_images_urls: remainingUrls.length > 0 ? remainingUrls : null,
      })
    } catch {
      // erro já tratado no hook
    } finally {
      setDeletingImageId(null)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-xl border-0 shadow">
          <div className="flex flex-col gap-3 bg-gradient-to-r from-primary to-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="p-0 text-xl text-primary-foreground">Projetos</CardTitle>
            <Button
              onClick={handleOpenNewProject}
              size="sm"
              className="whitespace-nowrap border-0 bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          </div>
          <CardHeader className="p-0 px-0 pb-4 pt-4">
            <div className="flex flex-col gap-4 px-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar projeto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Disponível em breve">Disponível em breve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 px-6 pb-6">
            {paginatedProjetos.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="Nenhum projeto encontrado"
                description="Não há projetos que correspondam aos filtros selecionados."
                actionLabel="Criar novo projeto"
                onAction={handleOpenNewProject}
              />
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl shadow">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Nome do Projeto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Bairro</TableHead>
                        <TableHead>Data de Entrega</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProjetos.map((projeto) => (
                        <TableRow key={projeto.id} className="transition-colors hover:bg-accent/15">
                          <TableCell className="font-medium">{projeto.name}</TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[projeto.status ?? ""] || "bg-gray-100 text-gray-700"}`}
                            >
                              {projeto.status}
                            </span>
                          </TableCell>
                          <TableCell>{projeto.neighborhood || "N/A"}</TableCell>
                          <TableCell>{projeto.delivery_date || "N/A"}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEditProject(projeto)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setViewImagesProjectId(projeto.id)}>
                                  <Images className="mr-2 h-4 w-4" />
                                  Imagens
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setProjectToDelete(projeto.id)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                      onPageChange={(page) => {
                        setCurrentPage(page)
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Novo / Editar Projeto */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          withGradientHeader
          className="mx-auto flex max-h-[calc(100vh-48px)] w-[calc(100%-32px)] max-w-2xl flex-col overflow-hidden p-0 sm:max-h-[90vh]"
        >
          <div className="shrink-0 rounded-t-xl bg-gradient-to-r from-primary to-secondary px-4 pb-4 pt-6 sm:px-6">
            <DialogHeader>
              <DialogTitle className="text-primary-foreground">
                {editMode ? "Editar Projeto" : "Novo Projeto"}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                {editMode ? "Edite as informações do projeto" : "Crie um novo projeto para começar a trabalhar"}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nome do Projeto *</Label>
              <Input
                id="project-name"
                placeholder="Digite o nome do projeto..."
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status ?? "Ativo"} onValueChange={(v) => setStatus(v as Project["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Disponível em breve">Disponível em breve</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Lançamento</Label>
                <p className="text-xs text-muted-foreground">Data de início das vendas</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !launchDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {launchDate ? format(launchDate, "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={launchDate}
                      onSelect={setLaunchDate}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Entrega</Label>
                <p className="text-xs text-muted-foreground">Previsão de entrega (mês/ano)</p>
                <div className="flex gap-2">
                  <Select
                    value={deliveryMonthYear ? String(deliveryMonthYear.month) : ""}
                    onValueChange={(val) =>
                      setDeliveryMonthYear((prev) => ({
                        year: prev?.year ?? new Date().getFullYear(),
                        month: Number(val),
                      }))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Janeiro",
                        "Fevereiro",
                        "Março",
                        "Abril",
                        "Maio",
                        "Junho",
                        "Julho",
                        "Agosto",
                        "Setembro",
                        "Outubro",
                        "Novembro",
                        "Dezembro",
                      ].map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={deliveryMonthYear ? String(deliveryMonthYear.year) : ""}
                    onValueChange={(val) =>
                      setDeliveryMonthYear((prev) => ({ month: prev?.month ?? 1, year: Number(val) }))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {deliveryMonthYear && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeliveryMonthYear(undefined)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {deliveryMonthYear && (
                  <p className="text-xs text-muted-foreground">
                    {String(deliveryMonthYear.month).padStart(2, "0")}/{deliveryMonthYear.year}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={estado}
                  onValueChange={(val) => {
                    setEstado(val)
                    setCidade(CIDADES_POR_ESTADO[val]?.[0] ?? "")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((e) => (
                      <SelectItem key={e.sigla} value={e.sigla}>
                        {e.sigla}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select value={cidade} onValueChange={setCidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(CIDADES_POR_ESTADO[estado] ?? []).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                placeholder="Ex: Barra da Tijuca"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference-points">Pontos de Referência</Label>
              <Input
                id="reference-points"
                placeholder="Ex: Próximo ao Shopping, ao lado do Parque..."
                value={referencePoints}
                onChange={(e) => setReferencePoints(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Digite a descrição do projeto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-site">Site do Empreendimento</Label>
              <Input
                id="link-site"
                type="url"
                placeholder="https://galwan.com.br/projetos/nome-do-projeto"
                value={linkSite}
                onChange={(e) => setLinkSite(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Imagens (até 20)</Label>
              <div className="space-y-3">
                {existingImages.length + images.length < 20 && (
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={isSaving}
                    />
                    <Label
                      htmlFor="image-upload"
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors hover:bg-muted/50",
                        isSaving && "cursor-not-allowed opacity-50",
                      )}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Salvando projeto...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          <span>Clique para fazer upload de imagens</span>
                        </>
                      )}
                    </Label>
                  </div>
                )}

                {existingImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Imagens salvas:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {existingImages.map((url, index) => (
                        <div key={`existing-${index}`} className="group relative">
                          <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                            <img src={url} alt={`Imagem ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => setExistingImages((prev) => prev.filter((_, i) => i !== index))}
                            disabled={isSaving}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {imagePreviews.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Novas imagens:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="group relative">
                          <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                            <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => handleRemoveImage(index)}
                            disabled={isSaving}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {existingImages.length + images.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {existingImages.length + images.length}{" "}
                    {existingImages.length + images.length === 1 ? "imagem" : "imagens"} no total
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border px-4 py-4 sm:flex-row sm:px-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProject} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : editMode ? (
                "Salvar Alterações"
              ) : (
                "Criar Projeto"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirmar exclusão"
        description="Tem certeza que deseja remover este projeto? Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      {viewImagesProjectId && (
        <Dialog open={!!viewImagesProjectId} onOpenChange={() => setViewImagesProjectId(null)}>
          <DialogContent withGradientHeader className="mx-auto flex max-h-[calc(100vh-48px)] w-[calc(100%-32px)] max-w-4xl flex-col overflow-hidden p-0 sm:max-h-[85vh]">
            <div className="shrink-0 rounded-t-xl bg-gradient-to-r from-primary to-secondary px-4 pb-4 pt-6 sm:px-6">
              <DialogHeader>
                <DialogTitle className="text-primary-foreground">Imagens do Projeto</DialogTitle>
              </DialogHeader>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {projectImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {projectImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                    >
                      <img
                        src={img.image_url}
                        alt="Imagem do projeto"
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                        disabled={deletingImageId === img.id || isAddingImages}
                        onClick={() => handleGalleryDelete(img)}
                      >
                        {deletingImageId === img.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">Nenhuma imagem disponível</p>
              )}

              <div>
                <label htmlFor="gallery-upload" className="cursor-pointer">
                  <div
                    className={cn(
                      "flex w-fit items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary",
                      isAddingImages && "pointer-events-none opacity-50",
                    )}
                  >
                    {isAddingImages ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" /> Adicionar imagens
                      </>
                    )}
                  </div>
                  <input
                    id="gallery-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={isAddingImages}
                    onChange={handleGalleryAdd}
                  />
                </label>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default Projetos
