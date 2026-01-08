"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Mail,
  Phone,
  ExternalLink,
  Target,
  Trophy,
  BarChart3,
  Save,
  X,
  Camera,
  ImageIcon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useScroll } from "@/hooks/use-scroll";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import { ImageCarousel } from "@/components/image-carousel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { PROJECT_TAGS, PROJECT_STATUSES, ProjectStatus } from "@/lib/schema";
import { cn } from "@/lib/utils";

interface Project {
  id: number;
  title: string;
  shortDescription: string | null;
  fullDescription: string | null;
  bannerImage: string | null;
  carouselImages: string[] | null;
  objectives: string | null;
  achievements: string | null;
  impact: string | null;
  tags: string[] | null;
  customTags: string[] | null;
  contactEmail: string | null;
  contactPhone: string | null;
  externalLink: string | null;
  status: ProjectStatus;
  companyId: number;
  companyName: string | null;
  companyLogo: string | null;
  companyDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TagInfo {
  key: string;
  name: string;
  color: string;
}

// Fonction pour obtenir la couleur d'un tag
function getTagColor(tagKey: string): string {
  const predefinedTag = PROJECT_TAGS[tagKey as keyof typeof PROJECT_TAGS];
  if (predefinedTag) {
    const colorMap: Record<string, string> = {
      "bg-red-500": "bg-red-500/10 text-red-600 border-red-500/20",
      "bg-green-500": "bg-green-500/10 text-green-600 border-green-500/20",
      "bg-blue-500": "bg-blue-500/10 text-blue-600 border-blue-500/20",
      "bg-pink-500": "bg-pink-500/10 text-pink-600 border-pink-500/20",
      "bg-purple-500": "bg-purple-500/10 text-purple-600 border-purple-500/20",
      "bg-orange-500": "bg-orange-500/10 text-orange-600 border-orange-500/20",
      "bg-teal-500": "bg-teal-500/10 text-teal-600 border-teal-500/20",
      "bg-amber-500": "bg-amber-500/10 text-amber-600 border-amber-500/20",
      "bg-lime-500": "bg-lime-500/10 text-lime-600 border-lime-500/20",
      "bg-cyan-500": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    };
    return colorMap[predefinedTag.color] || "bg-gray-500/10 text-gray-600";
  }
  return "bg-slate-500/10 text-slate-600 border-slate-500/20";
}

function getTagName(tagKey: string): string {
  const predefinedTag = PROJECT_TAGS[tagKey as keyof typeof PROJECT_TAGS];
  return predefinedTag ? predefinedTag.name : tagKey;
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(
    searchParams.get("edit") === "true"
  );
  const [isSaving, setIsSaving] = useState(false);

  // États d'édition
  const [editTitle, setEditTitle] = useState("");
  const [editShortDescription, setEditShortDescription] = useState("");
  const [editFullDescription, setEditFullDescription] = useState("");
  const [editObjectives, setEditObjectives] = useState("");
  const [editAchievements, setEditAchievements] = useState("");
  const [editImpact, setEditImpact] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editExternalLink, setEditExternalLink] = useState("");
  const [editBannerImage, setEditBannerImage] = useState<string | null>(null);
  const [editCarouselImages, setEditCarouselImages] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editCustomTags, setEditCustomTags] = useState<string[]>([]);
  const [newCustomTag, setNewCustomTag] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingCarousel, setUploadingCarousel] = useState(false);
  const hasScrolled = useScroll();

  const [predefinedTags, setPredefinedTags] = useState<TagInfo[]>([]);

  useEffect(() => {
    if (authStatus === "loading") return;

    if (!session || session.user?.accountType !== "business") {
      router.push("/login");
      return;
    }

    fetchProject();
    loadTags();
  }, [session, authStatus, router, resolvedParams.projectId]);

  const loadTags = async () => {
    try {
      const response = await fetch("/api/project-tags");
      if (response.ok) {
        const tags = await response.json();
        setPredefinedTags(tags);
      }
    } catch {
      const fallbackTags = Object.entries(PROJECT_TAGS).map(([key, value]) => ({
        key,
        name: value.name,
        color: value.color,
      }));
      setPredefinedTags(fallbackTags);
    }
  };

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${resolvedParams.projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        initEditStates(data);
      } else if (response.status === 404) {
        toast({
          title: "Projet non trouvé",
          description: "Ce projet n'existe pas ou a été supprimé.",
          variant: "destructive",
        });
        router.push("/business/projects");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le projet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initEditStates = (p: Project) => {
    setEditTitle(p.title);
    setEditShortDescription(p.shortDescription || "");
    setEditFullDescription(p.fullDescription || "");
    setEditObjectives(p.objectives || "");
    setEditAchievements(p.achievements || "");
    setEditImpact(p.impact || "");
    setEditContactEmail(p.contactEmail || "");
    setEditContactPhone(p.contactPhone || "");
    setEditExternalLink(p.externalLink || "");
    setEditBannerImage(p.bannerImage);
    setEditCarouselImages(p.carouselImages || []);
    setEditTags(p.tags || []);
    setEditCustomTags(p.customTags || []);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast({
        title: "Titre requis",
        description: "Le titre du projet est obligatoire.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/projects/${resolvedParams.projectId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle.trim(),
            shortDescription: editShortDescription.trim() || null,
            fullDescription: editFullDescription.trim() || null,
            objectives: editObjectives.trim() || null,
            achievements: editAchievements.trim() || null,
            impact: editImpact.trim() || null,
            contactEmail: editContactEmail.trim() || null,
            contactPhone: editContactPhone.trim() || null,
            externalLink: editExternalLink.trim() || null,
            bannerImage: editBannerImage,
            carouselImages: editCarouselImages,
            tags: editTags,
            customTags: editCustomTags,
          }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setProject((prev) => (prev ? { ...prev, ...updated } : null));
        setIsEditing(false);
        toast({
          title: "Projet mis à jour",
          description: "Les modifications ont été enregistrées.",
        });
      } else {
        throw new Error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!project) return;

    const newStatus = project.status === "archived" ? "active" : "archived";
    const action = newStatus === "archived" ? "archiver" : "réactiver";

    if (!confirm(`Êtes-vous sûr de vouloir ${action} ce projet ?`)) return;

    try {
      const response = await fetch(
        `/api/projects/${resolvedParams.projectId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        setProject((prev) => (prev ? { ...prev, status: newStatus } : null));
        toast({
          title: `Projet ${newStatus === "archived" ? "archivé" : "réactivé"}`,
          description: `Le projet a été ${
            newStatus === "archived" ? "archivé" : "réactivé"
          } avec succès.`,
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut du projet.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/projects/${resolvedParams.projectId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast({
          title: "Projet supprimé",
          description: "Le projet a été supprimé avec succès.",
        });
        router.push("/business/projects");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet.",
        variant: "destructive",
      });
    }
  };

  // Upload handlers
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "project");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setEditBannerImage(result.url);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur d'upload",
        variant: "destructive",
      });
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  };

  const handleCarouselUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const availableSlots = 10 - editCarouselImages.length;
    if (files.length > availableSlots) {
      toast({
        title: "Trop d'images",
        description: `Maximum ${availableSlots} image(s) supplémentaire(s).`,
        variant: "destructive",
      });
      return;
    }

    setUploadingCarousel(true);
    try {
      const newImages: string[] = [];
      for (const file of Array.from(files).slice(0, availableSlots)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "project");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          newImages.push(result.url);
        }
      }
      setEditCarouselImages((prev) => [...prev, ...newImages]);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploadingCarousel(false);
      e.target.value = "";
    }
  };

  const toggleTag = (tagKey: string) => {
    setEditTags((prev) =>
      prev.includes(tagKey)
        ? prev.filter((t) => t !== tagKey)
        : [...prev, tagKey]
    );
  };

  const addCustomTag = () => {
    const tag = newCustomTag.trim();
    if (tag && !editCustomTags.includes(tag)) {
      setEditCustomTags((prev) => [...prev, tag]);
      setNewCustomTag("");
    }
  };

  const getTagColorClass = (color: string): string => {
    const colorMap: Record<string, string> = {
      "bg-red-500":
        "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
      "bg-green-500":
        "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
      "bg-blue-500":
        "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
      "bg-pink-500":
        "bg-pink-500/10 text-pink-600 border-pink-500/20 hover:bg-pink-500/20",
      "bg-purple-500":
        "bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20",
      "bg-orange-500":
        "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20",
      "bg-teal-500":
        "bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20",
      "bg-amber-500":
        "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
      "bg-lime-500":
        "bg-lime-500/10 text-lime-600 border-lime-500/20 hover:bg-lime-500/20",
      "bg-cyan-500":
        "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 hover:bg-cyan-500/20",
    };
    return colorMap[color] || "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  if (authStatus === "loading" || loading) {
    return (
      <SidebarProvider>
        <DynamicSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!project) return null;

  const allTags = [...(project.tags || []), ...(project.customTags || [])];

  return (
    <SidebarProvider>
      <DynamicSidebar />
      <SidebarInset>
        <header
          className={`sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ${
            hasScrolled ? "border-b" : ""
          }`}
        >
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/business/dashboard">
                    Business Portal
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/business/projects">
                    Projets
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{project.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header avec actions */}
          <div className="flex justify-between items-start">
            <Button
              variant="ghost"
              onClick={() => router.push("/business/projects")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux projets
            </Button>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      initEditStates(project);
                    }}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Sauvegarder
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button variant="outline" onClick={handleArchive}>
                    {project.status === "archived" ? (
                      <>
                        <ArchiveRestore className="h-4 w-4 mr-2" />
                        Réactiver
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4 mr-2" />
                        Archiver
                      </>
                    )}
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              {/* Banner */}
              {isEditing ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Image de couverture
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editBannerImage ? (
                      <div className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <Image
                            src={editBannerImage}
                            alt="Banner"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setEditBannerImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Label className="cursor-pointer block">
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <span className="text-sm">Ajouter une image</span>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBannerUpload}
                          disabled={uploadingBanner}
                        />
                      </Label>
                    )}
                    {uploadingBanner && (
                      <div className="flex items-center justify-center mt-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Upload...
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                project.bannerImage && (
                  <div className="aspect-video relative rounded-xl overflow-hidden">
                    <Image
                      src={project.bannerImage}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                    {project.status === "archived" && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary">
                          {PROJECT_STATUSES[project.status]}
                        </Badge>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Titre et description */}
              <Card>
                <CardHeader>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Titre *</Label>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="text-xl font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description courte</Label>
                        <Textarea
                          value={editShortDescription}
                          onChange={(e) =>
                            setEditShortDescription(e.target.value)
                          }
                          className="resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-2xl">
                        {project.title}
                      </CardTitle>
                      {project.shortDescription && (
                        <CardDescription className="text-base">
                          {project.shortDescription}
                        </CardDescription>
                      )}
                    </>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label>Description complète</Label>
                      <Textarea
                        value={editFullDescription}
                        onChange={(e) => setEditFullDescription(e.target.value)}
                        className="min-h-[200px] resize-none"
                      />
                    </div>
                  ) : (
                    project.fullDescription && (
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {project.fullDescription}
                      </p>
                    )
                  )}
                </CardContent>
              </Card>

              {/* Objectifs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Objectifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editObjectives}
                      onChange={(e) => setEditObjectives(e.target.value)}
                      className="min-h-[150px] resize-none"
                      placeholder="Objectifs du projet..."
                    />
                  ) : project.objectives ? (
                    <p className="whitespace-pre-wrap">{project.objectives}</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Aucun objectif défini
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Réalisations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Réalisations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editAchievements}
                      onChange={(e) => setEditAchievements(e.target.value)}
                      className="min-h-[150px] resize-none"
                      placeholder="Réalisations du projet..."
                    />
                  ) : project.achievements ? (
                    <p className="whitespace-pre-wrap">
                      {project.achievements}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Aucune réalisation documentée
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editImpact}
                      onChange={(e) => setEditImpact(e.target.value)}
                      className="min-h-[120px] resize-none"
                      placeholder="Impact du projet..."
                    />
                  ) : project.impact ? (
                    <p className="whitespace-pre-wrap">{project.impact}</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Aucun impact documenté
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Galerie photos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Galerie photos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      {editCarouselImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                          {editCarouselImages.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative group aspect-video"
                            >
                              <Image
                                src={img}
                                alt={`Image ${idx + 1}`}
                                fill
                                className="object-cover rounded-lg"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() =>
                                  setEditCarouselImages((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {editCarouselImages.length < 10 && (
                        <Label className="cursor-pointer block">
                          <div className="border-2 border-dashed rounded-lg p-4 text-center">
                            <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                            <span className="text-sm">
                              Ajouter des photos (
                              {10 - editCarouselImages.length} restantes)
                            </span>
                          </div>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleCarouselUpload}
                            disabled={uploadingCarousel}
                          />
                        </Label>
                      )}
                      {uploadingCarousel && (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Upload...
                        </div>
                      )}
                    </div>
                  ) : project.carouselImages &&
                    project.carouselImages.length > 0 ? (
                    <ImageCarousel
                      images={project.carouselImages}
                      alt={project.title}
                      aspectRatio="video"
                      showThumbnails
                      allowFullscreen
                    />
                  ) : (
                    <p className="text-muted-foreground italic">
                      Aucune photo dans la galerie
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Organisation */}
              <Card>
                <CardHeader>
                  <CardTitle>Organisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={project.companyLogo || ""} />
                      <AvatarFallback>
                        {project.companyName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{project.companyName}</p>
                      {project.companyDescription && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.companyDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {predefinedTags.map((tag) => (
                          <button
                            key={tag.key}
                            type="button"
                            onClick={() => toggleTag(tag.key)}
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium border transition-all",
                              editTags.includes(tag.key)
                                ? cn(
                                    getTagColorClass(tag.color),
                                    "ring-2 ring-offset-1 ring-primary/50"
                                  )
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                      <Separator />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Tag personnalisé..."
                          value={newCustomTag}
                          onChange={(e) => setNewCustomTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomTag();
                            }
                          }}
                          className="h-8 text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addCustomTag}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      {editCustomTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editCustomTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="pr-1"
                            >
                              {tag}
                              <button
                                onClick={() =>
                                  setEditCustomTags((prev) =>
                                    prev.filter((t) => t !== tag)
                                  )
                                }
                                className="ml-1 p-0.5 hover:bg-muted rounded"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : allTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={getTagColor(tag)}
                        >
                          {getTagName(tag)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Aucun tag</p>
                  )}
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4" /> Email
                        </Label>
                        <Input
                          type="email"
                          value={editContactEmail}
                          onChange={(e) => setEditContactEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4" /> Téléphone
                        </Label>
                        <Input
                          type="tel"
                          value={editContactPhone}
                          onChange={(e) => setEditContactPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <ExternalLink className="h-4 w-4" /> Lien externe
                        </Label>
                        <Input
                          type="url"
                          value={editExternalLink}
                          onChange={(e) => setEditExternalLink(e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {project.contactEmail && (
                        <a
                          href={`mailto:${project.contactEmail}`}
                          className="flex items-center gap-2 text-sm hover:underline"
                        >
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {project.contactEmail}
                        </a>
                      )}
                      {project.contactPhone && (
                        <a
                          href={`tel:${project.contactPhone}`}
                          className="flex items-center gap-2 text-sm hover:underline"
                        >
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {project.contactPhone}
                        </a>
                      )}
                      {project.externalLink && (
                        <a
                          href={project.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm hover:underline"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          Voir le site
                        </a>
                      )}
                      {!project.contactEmail &&
                        !project.contactPhone &&
                        !project.externalLink && (
                          <p className="text-muted-foreground text-sm">
                            Aucune information de contact
                          </p>
                        )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Informations */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut</span>
                    <Badge
                      variant={
                        project.status === "active" ? "default" : "secondary"
                      }
                    >
                      {PROJECT_STATUSES[project.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Créé le</span>
                    <span>
                      {new Date(project.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modifié le</span>
                    <span>
                      {new Date(project.updatedAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
