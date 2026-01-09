"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  Loader2,
  X,
  Info,
  Target,
  Trophy,
  BarChart3,
  Tag,
  Phone,
  Mail,
  Link as LinkIcon,
  Plus,
  ImageIcon,
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
import { useToast } from "@/hooks/use-toast";
import { useScroll } from "@/hooks/use-scroll";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { PROJECT_TAGS } from "@/lib/schema";
import { cn } from "@/lib/utils";

// Types pour les tags
interface TagInfo {
  key: string;
  name: string;
  color: string;
}

export default function CreateProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // États du formulaire - Informations de base
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");

  // Visuels
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingCarousel, setUploadingCarousel] = useState(false);

  // Contenu
  const [objectives, setObjectives] = useState("");
  const [achievements, setAchievements] = useState("");
  const [impact, setImpact] = useState("");

  // Tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newCustomTag, setNewCustomTag] = useState("");
  const [predefinedTags, setPredefinedTags] = useState<TagInfo[]>([]);

  // Contact
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [externalLink, setExternalLink] = useState("");

  // Soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasScrolled = useScroll();

  // Charger les tags prédéfinis
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch("/api/project-tags");
        if (response.ok) {
          const tags = await response.json();
          setPredefinedTags(tags);
        }
      } catch (_error) {
        // Utiliser les tags du schema comme fallback
        const fallbackTags = Object.entries(PROJECT_TAGS).map(
          ([key, value]) => ({
            key,
            name: value.name,
            color: value.color,
          })
        );
        setPredefinedTags(fallbackTags);
      }
    };
    loadTags();
  }, []);

  // Upload de l'image banner
  const handleBannerUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Type de fichier invalide",
        description: "Utilisez uniquement JPG, PNG ou WebP.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "project");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      let result;
      try {
        result = await response.json();
      } catch (_parseError) {
        throw new Error(
          `Erreur HTTP ${response.status}: ${response.statusText}`
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Erreur HTTP ${response.status}: ${response.statusText}`
        );
      }

      setBannerImage(result.url);
      toast({
        title: "Image ajoutée",
        description: "L'image de banner a été ajoutée avec succès.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur d'upload",
        description: "Une erreur s'est produite lors de l'upload de l'image.",
        variant: "destructive",
      });
    } finally {
      setUploadingBanner(false);
      event.target.value = "";
    }
  };

  // Upload des images carrousel
  const handleCarouselUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxImages = 10;
    const currentCount = carouselImages.length;
    const availableSlots = maxImages - currentCount;

    if (files.length > availableSlots) {
      toast({
        title: "Trop d'images",
        description: `Vous pouvez ajouter maximum ${availableSlots} image(s) supplémentaire(s).`,
        variant: "destructive",
      });
      return;
    }

    setUploadingCarousel(true);

    try {
      const newImages: string[] = [];

      for (let i = 0; i < files.length && i < availableSlots; i++) {
        const file = files[i];

        const maxSize = 5 * 1024 * 1024;
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Type de fichier invalide",
            description: `${file.name}: Utilisez uniquement JPG, PNG ou WebP.`,
            variant: "destructive",
          });
          continue;
        }

        if (file.size > maxSize) {
          toast({
            title: "Fichier trop volumineux",
            description: `${file.name}: La taille maximale est de 5MB.`,
            variant: "destructive",
          });
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "project");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        let result;
        try {
          result = await response.json();
        } catch (_parseError) {
          throw new Error(
            `Erreur HTTP ${response.status}: ${response.statusText}`
          );
        }

        if (!response.ok) {
          throw new Error(
            result?.error ||
              `Erreur HTTP ${response.status}: ${response.statusText}`
          );
        }

        newImages.push(result.url);
      }

      setCarouselImages((prev) => [...prev, ...newImages]);

      if (newImages.length > 0) {
        toast({
          title: "Images ajoutées",
          description: `${newImages.length} image(s) ajoutée(s) au carrousel.`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur d'upload",
        description: "Une erreur s'est produite lors de l'upload des images.",
        variant: "destructive",
      });
    } finally {
      setUploadingCarousel(false);
      event.target.value = "";
    }
  };

  const removeBannerImage = () => {
    setBannerImage(null);
  };

  const removeCarouselImage = (index: number) => {
    setCarouselImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Gestion des tags
  const toggleTag = (tagKey: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagKey)
        ? prev.filter((t) => t !== tagKey)
        : [...prev, tagKey]
    );
  };

  const addCustomTag = () => {
    const tag = newCustomTag.trim();
    if (tag && !customTags.includes(tag)) {
      setCustomTags((prev) => [...prev, tag]);
      setNewCustomTag("");
    }
  };

  const removeCustomTag = (tag: string) => {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    // Validation
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push("Titre du projet");
    }

    if (errors.length > 0) {
      toast({
        title: "Champs requis manquants",
        description: `Veuillez remplir : ${errors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    if (uploadingBanner || uploadingCarousel) {
      toast({
        title: "Upload en cours",
        description: "Veuillez attendre la fin de l'upload des images.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        title: title.trim(),
        shortDescription: shortDescription.trim() || null,
        fullDescription: fullDescription.trim() || null,
        bannerImage,
        carouselImages,
        objectives: objectives.trim() || null,
        achievements: achievements.trim() || null,
        impact: impact.trim() || null,
        tags: selectedTags,
        customTags,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        externalLink: externalLink.trim() || null,
        status: "active",
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        toast({
          title: "Projet créé !",
          description: "Votre projet est maintenant visible.",
        });
        router.push("/business/projects");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création du projet");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la création du projet.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour obtenir la couleur d'un tag
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

  if (status === "loading") {
    return (
      <SidebarProvider>
        <DynamicSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </header>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!session || session.user?.accountType !== "business") {
    router.push("/login");
    return null;
  }

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
                  <BreadcrumbPage>Créer un projet</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Nouveau projet</h1>
            <p className="text-muted-foreground mt-1">
              Présentez un projet de votre association pour informer et engager
              votre communauté
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="xl:col-span-2 space-y-6">
              {/* Informations de base */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Informations de base
                  </CardTitle>
                  <CardDescription>
                    Les informations essentielles de votre projet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre du projet *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Aide aux sans-abris, Nettoyage des plages..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shortDescription">Description courte</Label>
                    <Textarea
                      id="shortDescription"
                      placeholder="Une brève description qui apparaîtra sur la carte du projet (2-3 phrases)"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      className="min-h-[80px] resize-none"
                      maxLength={300}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {shortDescription.length}/300 caractères
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullDescription">
                      Description complète
                    </Label>
                    <Textarea
                      id="fullDescription"
                      placeholder="Décrivez votre projet en détail : contexte, historique, actions menées..."
                      value={fullDescription}
                      onChange={(e) => setFullDescription(e.target.value)}
                      className="min-h-[200px] resize-none"
                      maxLength={5000}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {fullDescription.length}/5000 caractères
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Objectifs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Objectifs
                  </CardTitle>
                  <CardDescription>
                    Quels sont les objectifs de ce projet ?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="objectives"
                    placeholder="Listez les objectifs principaux de votre projet...
• Objectif 1
• Objectif 2
• Objectif 3"
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                    className="min-h-[150px] resize-none"
                    maxLength={2000}
                  />
                  <div className="text-xs text-muted-foreground text-right mt-1">
                    {objectives.length}/2000 caractères
                  </div>
                </CardContent>
              </Card>

              {/* Réalisations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Réalisations
                  </CardTitle>
                  <CardDescription>
                    Ce qui a été accompli jusqu&apos;à présent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="achievements"
                    placeholder="Décrivez les réalisations et succès du projet...
• 500 repas distribués
• 20 bénévoles mobilisés
• 3 partenariats créés"
                    value={achievements}
                    onChange={(e) => setAchievements(e.target.value)}
                    className="min-h-[150px] resize-none"
                    maxLength={2000}
                  />
                  <div className="text-xs text-muted-foreground text-right mt-1">
                    {achievements.length}/2000 caractères
                  </div>
                </CardContent>
              </Card>

              {/* Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Impact
                  </CardTitle>
                  <CardDescription>
                    Mesurez l&apos;impact de votre projet (optionnel)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="impact"
                    placeholder="Décrivez l'impact concret de votre projet sur les bénéficiaires, l'environnement, la communauté..."
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    className="min-h-[120px] resize-none"
                    maxLength={1500}
                  />
                  <div className="text-xs text-muted-foreground text-right mt-1">
                    {impact.length}/1500 caractères
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                  <CardDescription>
                    Catégorisez votre projet pour le rendre plus facilement
                    trouvable
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tags prédéfinis */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Tags prédéfinis
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {predefinedTags.map((tag) => (
                        <button
                          key={tag.key}
                          type="button"
                          onClick={() => toggleTag(tag.key)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                            selectedTags.includes(tag.key)
                              ? cn(
                                  getTagColorClass(tag.color),
                                  "ring-2 ring-offset-2 ring-primary/50"
                                )
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Tags personnalisés */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Tags personnalisés
                    </Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Ajouter un tag personnalisé..."
                        value={newCustomTag}
                        onChange={(e) => setNewCustomTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomTag();
                          }
                        }}
                        maxLength={30}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addCustomTag}
                        disabled={!newCustomTag.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {customTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {customTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="pr-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeCustomTag(tag)}
                              className="ml-1 p-0.5 hover:bg-muted rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Image Banner */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Image de couverture
                  </CardTitle>
                  <CardDescription>
                    L&apos;image principale qui représente votre projet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bannerImage ? (
                    <div className="relative group">
                      <div className="aspect-video rounded-lg overflow-hidden border">
                        <Image
                          src={bannerImage}
                          alt="Banner du projet"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={removeBannerImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <div className="text-center space-y-3">
                        <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                        <div>
                          <Label
                            htmlFor="banner-upload"
                            className="cursor-pointer"
                          >
                            <span className="text-sm font-medium hover:underline">
                              Ajouter une image de couverture
                            </span>
                            <Input
                              id="banner-upload"
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={handleBannerUpload}
                              className="hidden"
                              disabled={uploadingBanner}
                            />
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG ou WebP • Max 5MB
                          </p>
                        </div>
                        {uploadingBanner && (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Upload...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Carrousel d'images */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Galerie photos
                  </CardTitle>
                  <CardDescription>
                    Ajoutez jusqu&apos;à 10 photos pour illustrer votre projet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {carouselImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {carouselImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-video rounded-lg overflow-hidden border">
                            <Image
                              src={image}
                              alt={`Image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeCarouselImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {carouselImages.length < 10 && (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                      <div className="text-center space-y-2">
                        <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground" />
                        <div>
                          <Label
                            htmlFor="carousel-upload"
                            className="cursor-pointer"
                          >
                            <span className="text-sm font-medium hover:underline">
                              Ajouter des photos
                            </span>
                            <Input
                              id="carousel-upload"
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              multiple
                              onChange={handleCarouselUpload}
                              className="hidden"
                              disabled={uploadingCarousel}
                            />
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {10 - carouselImages.length} emplacement(s)
                            disponible(s)
                          </p>
                        </div>
                        {uploadingCarousel && (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Upload...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                  <CardDescription>
                    Informations de contact pour ce projet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="contactEmail"
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="contact@association.org"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="contactPhone"
                      className="flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Téléphone
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="01 23 45 67 89"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="externalLink"
                      className="flex items-center gap-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Lien externe
                    </Label>
                    <Input
                      id="externalLink"
                      type="url"
                      placeholder="https://..."
                      value={externalLink}
                      onChange={(e) => setExternalLink(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Site web du projet, page de don, etc.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer le projet"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    Annuler
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Les champs marqués d&apos;un * sont obligatoires
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
