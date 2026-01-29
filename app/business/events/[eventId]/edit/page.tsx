"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Camera,
    Loader2,
    X,
    Info,
    Calendar,
    MapPin,
    Users,
    Euro,
    Phone,
    Mail,
    Link as LinkIcon,
    ImageIcon,
    AlertTriangle,
    HelpCircle,
    Clock,
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
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select";
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
import {
    EVENT_TYPES,
    EVENT_CATEGORIES,
    RecurrenceType,
    EventType,
    MissionType,
} from "@/lib/schema";
import { BackgroundSelector } from "@/components/background-selector";
import { generateRandomGradient, type Gradient } from "@/lib/gradient-generator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EventPlanningCalendar } from "@/components/event-planning-calendar";
import { PlanningInfoDialog } from "@/components/planning-info-dialog";

interface EventData {
  id: number;
  title: string;
  description: string | null;
  eventType: EventType;
  startDate: string;
  endDate: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  images: string[] | null;
  coverImage: string | null;
  backgroundType: "image" | "gradient" | null;
  backgroundImageIndex: number | null;
  backgroundGradient: {
    color1: string;
    color2: string;
    css: string;
  } | null;
  maxParticipants: number | null;
  recurrence: string | null;
  recurrenceEndDate: string | null;
  recurrenceGroupId: number | null;
  isPaid: boolean;
  price: string | null;
  currency: string;
  fundraisingGoal: string | null;
  requirements: string | null;
  targetAudience: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  externalLink: string | null;
  status: string;
  hasPlanning?: boolean;
  slots?: Array<{
    id: number;
    startTime: string;
    endTime: string;
    maxParticipants: number;
    missions?: Array<{
      type: string;
      description?: string | null;
      maxParticipants: number;
    }>;
    missionType?: string | null;
    missionDescription?: string | null;
  }>;
}

export default function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // États du formulaire - Informations de base
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<EventType | "">("");

  // Date et heure
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  // Lieu
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  // Participants
  const [maxParticipants, setMaxParticipants] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [requirements, setRequirements] = useState("");

  // Tarification et collecte
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [fundraisingGoal, setFundraisingGoal] = useState("");

  // Contact et liens
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [externalLink, setExternalLink] = useState("");

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Background
  const [backgroundType, setBackgroundType] = useState<"image" | "gradient" | null>("gradient");
  const [backgroundImageIndex, setBackgroundImageIndex] = useState<number | null>(null);
  const [backgroundGradient, setBackgroundGradient] = useState<Gradient | null>(null);

  // Planning
  const [planningEnabled, setPlanningEnabled] = useState(false);
  const [slotDuration, setSlotDuration] = useState("60"); // en minutes
  const [slots, setSlots] = useState<
    Array<{
      id?: number;
      startTime: string;
      endTime: string;
      maxParticipants: number;
      missions: Array<{
        type: MissionType;
        description?: string;
        maxParticipants: number;
      }>;
      // Champs dépréciés pour compatibilité
      missionType?: MissionType;
      missionDescription?: string;
    }>
  >([]);

  // États de chargement et données
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const hasScrolled = useScroll();

  // Fonction pour convertir une date ISO en format date input (YYYY-MM-DD)
  const formatDateForInput = (isoString: string | null): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fonction pour convertir une date ISO en format time input (HH:mm)
  const formatTimeForInput = (isoString: string | null): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Charger les données de l'événement
  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.accountType !== "business") {
      router.push("/login");
      return;
    }

    const fetchEvent = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/events/${resolvedParams.eventId}`);
        if (response.ok) {
          const data: EventData = await response.json();
          setEventData(data);

          // Pré-remplir le formulaire
          setTitle(data.title || "");
          setDescription(data.description || "");
          setEventType(data.eventType || "");

          // Dates
          setStartDate(formatDateForInput(data.startDate));
          setStartTime(formatTimeForInput(data.startDate));
          if (data.endDate) {
            setEndDate(formatDateForInput(data.endDate));
            setEndTime(formatTimeForInput(data.endDate));
          }

          // Récurrence
          setRecurrence((data.recurrence as RecurrenceType) || "none");
          if (data.recurrenceEndDate) {
            setRecurrenceEndDate(formatDateForInput(data.recurrenceEndDate));
          }

          // Lieu
          setLocation(data.location || "");
          setAddress(data.address || "");
          setCity(data.city || "");

          // Participants
          setMaxParticipants(data.maxParticipants?.toString() || "");
          setTargetAudience(data.targetAudience || "");
          setRequirements(data.requirements || "");

          // Tarification
          setIsPaid(data.isPaid || false);
          setPrice(data.price || "");
          setFundraisingGoal(data.fundraisingGoal || "");

          // Contact
          setContactEmail(data.contactEmail || "");
          setContactPhone(data.contactPhone || "");
          setExternalLink(data.externalLink || "");

          // Images
          setImages(data.images || []);
          setCoverImage(data.coverImage || null);

          // Background
          setBackgroundType(data.backgroundType || "gradient");
          setBackgroundImageIndex(data.backgroundImageIndex ?? null);
          if (data.backgroundGradient) {
            setBackgroundGradient(data.backgroundGradient);
          } else if (data.backgroundType === "gradient") {
            // Générer un gradient par défaut si aucun n'existe
            const initialGradient = generateRandomGradient();
            setBackgroundGradient(initialGradient);
          }

          // Charger les slots si l'événement a un planning
          if (data.hasPlanning && data.slots) {
            setPlanningEnabled(true);
            // Calculer la durée moyenne des slots pour slotDuration
            if (data.slots.length > 0) {
              const firstSlot = data.slots[0];
              const start = new Date(firstSlot.startTime);
              const end = new Date(firstSlot.endTime);
              const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
              setSlotDuration(durationMinutes.toString());
            }
            // Convertir les slots au format attendu
            const formattedSlots = data.slots.map((slot) => ({
              id: slot.id,
              startTime: slot.startTime,
              endTime: slot.endTime,
              maxParticipants: slot.maxParticipants,
              missions: (slot.missions || (slot.missionType ? [{
                type: slot.missionType,
                description: slot.missionDescription || undefined,
                maxParticipants: slot.maxParticipants || 10,
              }] : [])).map((m: { type: string; description?: string | null; maxParticipants: number }) => ({
                type: m.type as MissionType,
                description: m.description || undefined,
                maxParticipants: m.maxParticipants,
              })),
              missionType: slot.missionType as MissionType | undefined,
              missionDescription: slot.missionDescription || undefined,
            })) as typeof slots;
            setSlots(formattedSlots);
          }
        } else if (response.status === 404) {
          toast({
            title: "Événement non trouvé",
            description: "Cet événement n'existe pas ou a été supprimé.",
            variant: "destructive",
          });
          router.push("/business/events");
        } else {
          throw new Error("Erreur lors du chargement");
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger l'événement.",
          variant: "destructive",
        });
        router.push("/business/events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [session, status, router, resolvedParams.eventId, toast]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxImages = 4;
    const currentCount = images.length;
    const availableSlots = maxImages - currentCount;

    if (files.length > availableSlots) {
      toast({
        title: "Trop d'images",
        description: `Vous pouvez ajouter maximum ${availableSlots} image(s) supplémentaire(s).`,
        variant: "destructive",
      });
      return;
    }

    setUploadingImages(true);

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
            description: "Utilisez uniquement JPG, PNG ou WebP.",
            variant: "destructive",
          });
          continue;
        }

        if (file.size > maxSize) {
          toast({
            title: "Fichier trop volumineux",
            description: "La taille maximale est de 5MB par image.",
            variant: "destructive",
          });
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "event");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erreur lors de l'upload");
        }

        newImages.push(result.url);
      }

      setImages((prev) => [...prev, ...newImages]);

      if (newImages.length > 0) {
        toast({
          title: "Images ajoutées",
          description: `${newImages.length} image(s) ajoutée(s) avec succès.`,
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
      setUploadingImages(false);
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    // Si l'image supprimée était sélectionnée comme background, réinitialiser
    if (backgroundImageIndex === index && backgroundType === "image") {
      setBackgroundType("gradient");
      setBackgroundImageIndex(null);
    } else if (backgroundImageIndex !== null && backgroundImageIndex > index) {
      // Ajuster l'index si nécessaire
      setBackgroundImageIndex(backgroundImageIndex - 1);
    }
  };

  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

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

    setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "event");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'upload");
      }

      setCoverImage(result.url);
      // Si une cover est uploadée, la sélectionner automatiquement comme background
      setBackgroundType("image");
      setBackgroundImageIndex(null); // null signifie que c'est la cover

      toast({
        title: "Image de cover ajoutée",
        description: "L'image de cover a été ajoutée avec succès.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur d'upload",
        description: "Une erreur s'est produite lors de l'upload de l'image de cover.",
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    // Si la cover était sélectionnée comme background, revenir au gradient
    if (backgroundType === "image" && backgroundImageIndex === null) {
      setBackgroundType("gradient");
    }
  };

  // Fonctions pour gérer le planning
  const generateSlots = () => {
    if (!startDate || !startTime) {
      toast({
        title: "Date et heure requises",
        description: "Veuillez d'abord définir la date et l'heure de début de l'événement.",
        variant: "destructive",
      });
      return;
    }

    const start = new Date(`${startDate}T${startTime}`);
    const end = endDate && endTime
      ? new Date(`${endDate}T${endTime}`)
      : endTime
      ? new Date(`${startDate}T${endTime}`)
      : null;

    if (!end) {
      toast({
        title: "Heure de fin requise",
        description: "Veuillez définir l'heure de fin pour générer les créneaux.",
        variant: "destructive",
      });
      return;
    }

    const duration = parseInt(slotDuration);
    if (duration < 15) {
      toast({
        title: "Durée invalide",
        description: "La durée minimale d'un créneau est de 15 minutes.",
        variant: "destructive",
      });
      return;
    }

    const generatedSlots: typeof slots = [];
    let currentStart = new Date(start);

    while (currentStart < end) {
      const currentEnd = new Date(currentStart.getTime() + duration * 60000);
      if (currentEnd > end) break;

      generatedSlots.push({
        startTime: currentStart.toISOString(),
        endTime: currentEnd.toISOString(),
        maxParticipants: 10,
        missions: [{
          type: "autre",
          description: "",
          maxParticipants: 10,
        }],
      });

      currentStart = new Date(currentEnd);
    }

    if (generatedSlots.length === 0) {
      toast({
        title: "Aucun créneau généré",
        description: "La durée des créneaux est trop longue pour la durée de l'événement.",
        variant: "destructive",
      });
      return;
    }

    setSlots(generatedSlots);
    toast({
      title: `${generatedSlots.length} créneau(x) généré(s)`,
      description: "Vous pouvez maintenant les personnaliser.",
    });
  };

  const handleSubmit = async () => {
    // Validation avec messages d'erreur détaillés
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push("Titre de l'événement");
    }

    if (!eventType) {
      errors.push("Type d'événement");
    }

    if (!startDate) {
      errors.push("Date de début");
    }

    if (!startTime) {
      errors.push("Heure de début");
    }

    if (isPaid && !price) {
      errors.push("Prix (événement payant)");
    }

    if (recurrence !== "none" && !recurrenceEndDate) {
      errors.push("Date de fin de récurrence");
    }

    // Si des erreurs, afficher un toast avec la liste
    if (errors.length > 0) {
      toast({
        title: "Champs requis manquants",
        description: `Veuillez remplir : ${errors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Vérifier si on est en train d'uploader
    if (uploadingImages || uploadingCover) {
      toast({
        title: "Upload en cours",
        description: "Veuillez attendre la fin de l'upload des images.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      let endDateTime = null;
      if (endDate && endTime) {
        endDateTime = new Date(`${endDate}T${endTime}`);
      } else if (endTime) {
        endDateTime = new Date(`${startDate}T${endTime}`);
      }

      const eventData = {
        title: title.trim(),
        description: description.trim() || null,
        eventType,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime?.toISOString() || null,
        location: location.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        images,
        coverImage: coverImage || null,
        backgroundType,
        // Si backgroundType est "image" et backgroundImageIndex est null, c'est la cover
        // Sinon, c'est une image de la galerie
        backgroundImageIndex: backgroundType === "image" ? backgroundImageIndex : null,
        backgroundGradient: backgroundType === "gradient" ? backgroundGradient : null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        recurrence,
        recurrenceEndDate: recurrenceEndDate
          ? new Date(recurrenceEndDate).toISOString()
          : null,
        isPaid,
        price: isPaid && price ? parseFloat(price) : null,
        currency: "EUR",
        fundraisingGoal: fundraisingGoal ? parseFloat(fundraisingGoal) : null,
        requirements: requirements.trim() || null,
        targetAudience: targetAudience.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        externalLink: externalLink.trim() || null,
        planning: planningEnabled
          ? {
              enabled: true,
              slotDurationMinutes: parseInt(slotDuration),
              slots: slots.map((slot) => ({
                id: slot.id, // Garder l'ID pour les slots existants
                startTime: slot.startTime,
                endTime: slot.endTime,
                maxParticipants: slot.maxParticipants,
                missions: slot.missions || (slot.missionType ? [{
                  type: slot.missionType,
                  description: slot.missionDescription,
                  maxParticipants: slot.maxParticipants || 10,
                }] : []),
              })),
            }
          : { enabled: false },
      };

      const response = await fetch(`/api/events/${resolvedParams.eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        toast({
          title: "Événement modifié !",
          description: "Vos modifications ont été enregistrées avec succès.",
        });
        router.push(`/business/events/${resolvedParams.eventId}`);
      } else {
        const error = await response.json();
        throw new Error(
          error.error || "Erreur lors de la modification de l'événement"
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description:
          "Une erreur s'est produite lors de la modification de l'événement.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
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

  const isRecurring = eventData?.recurrenceGroupId !== null || (eventData?.recurrence && eventData.recurrence !== "none");

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
                  <BreadcrumbLink href="/business/events">
                    Événements
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Modifier l&apos;événement</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Modifier l&apos;événement</h1>
            <p className="text-muted-foreground mt-1">
              Modifiez les informations de votre événement
            </p>
          </div>

          {/* Avertissement pour événements récurrents */}
          {isRecurring && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      <strong>Événement récurrent :</strong> Cet événement fait partie d&apos;une série récurrente. Les modifications apportées seront appliquées à tous les événements de la série.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="informations" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="informations">Informations</TabsTrigger>
              <TabsTrigger 
                value="planning" 
                disabled={!startDate || !startTime}
                title={!startDate || !startTime ? "Veuillez d'abord renseigner la date et l'heure de début" : ""}
              >
                Planning
                {(!startDate || !startTime) && (
                  <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="informations" className="mt-6">
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
                    Les informations essentielles de votre événement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="title">Titre de l&apos;événement *</Label>
                      <Input
                        id="title"
                        placeholder="Ex: Maraude du samedi, Soirée caritative..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        className="text-lg"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="eventType">Type d&apos;événement *</Label>
                      <Select
                        value={eventType}
                        onValueChange={(v) => setEventType(v as EventType)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EVENT_CATEGORIES).map(
                            ([categoryKey, category]) => (
                              <SelectGroup key={categoryKey}>
                                <SelectLabel>{category.label}</SelectLabel>
                                {category.types.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {EVENT_TYPES[type as EventType]}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Décrivez votre événement en détail : objectifs, activités prévues, informations importantes..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[150px] resize-none"
                        maxLength={2000}
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {description.length}/2000 caractères
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date et heure */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Date et horaires
                  </CardTitle>
                  <CardDescription>
                    Quand aura lieu votre événement ?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Date de début *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Heure de début *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Date de fin</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={
                          startDate || new Date().toISOString().split("T")[0]
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">Heure de fin</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurrence">Récurrence</Label>
                      <Select
                        value={recurrence}
                        onValueChange={(v) =>
                          setRecurrence(v as RecurrenceType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune</SelectItem>
                          <SelectItem value="daily">Quotidienne</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Mensuelle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {recurrence !== "none" && (
                      <div className="space-y-2">
                        <Label htmlFor="recurrenceEndDate">
                          Fin de la récurrence
                        </Label>
                        <Input
                          id="recurrenceEndDate"
                          type="date"
                          value={recurrenceEndDate}
                          onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          min={startDate}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lieu */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Lieu
                  </CardTitle>
                  <CardDescription>
                    Où se déroulera l&apos;événement ? (optionnel)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Nom du lieu</Label>
                      <Input
                        id="location"
                        placeholder="Ex: Place de la République"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        placeholder="Ex: 1 Place de la République"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        placeholder="Ex: Paris"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participants */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants
                  </CardTitle>
                  <CardDescription>
                    Définissez les conditions de participation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxParticipants">
                        Nombre maximum de participants
                      </Label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        placeholder="Laissez vide pour illimité"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        min="1"
                      />
                      <p className="text-xs text-muted-foreground">
                        Une liste d&apos;attente sera créée si le maximum est
                        atteint.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetAudience">Public cible</Label>
                      <Input
                        id="targetAudience"
                        placeholder="Ex: Tout public, Bénévoles expérimentés..."
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirements">Prérequis / À apporter</Label>
                    <Textarea
                      id="requirements"
                      placeholder="Ex: Vêtements chauds, chaussures de marche, pièce d'identité..."
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tarification et collecte */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5" />
                    Tarification et collecte
                  </CardTitle>
                  <CardDescription>
                    Configurez les options de paiement et de collecte de fonds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="isPaid" className="text-base">
                        Événement payant
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Les participants devront payer pour s&apos;inscrire
                      </p>
                    </div>
                    <Switch
                      id="isPaid"
                      checked={isPaid}
                      onCheckedChange={setIsPaid}
                    />
                  </div>

                  {isPaid && (
                    <div className="space-y-2">
                      <Label htmlFor="price">Prix (€)</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="fundraisingGoal">
                      Objectif de collecte de fonds (€)
                    </Label>
                    <Input
                      id="fundraisingGoal"
                      type="number"
                      placeholder="Laissez vide si non applicable"
                      value={fundraisingGoal}
                      onChange={(e) => setFundraisingGoal(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pour les événements de type collecte de fonds
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Images et Cover */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Images et Cover
                  </CardTitle>
                  <CardDescription>
                    Ajoutez des visuels pour votre événement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Section Images de l'événement */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">
                        Images de l&apos;événement
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {images.length}/4
                      </span>
                    </div>
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {images.map((image, index) => (
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
                              className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {images.length < 4 && (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                        <div className="text-center space-y-2">
                          <Camera className="h-6 w-6 mx-auto text-muted-foreground" />
                          <div>
                            <Label
                              htmlFor="image-upload"
                              className="cursor-pointer"
                            >
                              <span className="text-sm font-medium hover:underline">
                                Ajouter des images
                              </span>
                              <Input
                                id="image-upload"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploadingImages}
                              />
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Max 5MB • {4 - images.length} restantes
                            </p>
                          </div>
                          {uploadingImages && (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Upload...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Section Image de cover */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Image de cover
                    </Label>
                    {coverImage ? (
                      <div className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden border">
                          <Image
                            src={coverImage}
                            alt="Cover"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={removeCoverImage}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                        <div className="text-center space-y-2">
                          <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground" />
                          <div>
                            <Label
                              htmlFor="cover-upload"
                              className="cursor-pointer"
                            >
                              <span className="text-sm font-medium hover:underline">
                                Ajouter une image de cover
                              </span>
                              <Input
                                id="cover-upload"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleCoverUpload}
                                className="hidden"
                                disabled={uploadingCover}
                              />
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Max 5MB • Optionnel
                            </p>
                          </div>
                          {uploadingCover && (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Upload...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Sélecteur de background - Toujours visible */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Background de l&apos;événement
                    </Label>
                    <BackgroundSelector
                      images={
                        coverImage
                          ? [coverImage, ...images] // Cover en premier si elle existe
                          : images
                      }
                      backgroundType={backgroundType}
                      backgroundImageIndex={
                        backgroundType === "image"
                          ? coverImage && backgroundImageIndex === null
                            ? 0 // Cover est à l'index 0 si elle existe
                            : coverImage && backgroundImageIndex !== null
                            ? backgroundImageIndex + 1 // Ajuster l'index car cover est à l'index 0
                            : backgroundImageIndex
                          : null
                      }
                      backgroundGradient={backgroundGradient}
                      onBackgroundTypeChange={(type) => {
                        setBackgroundType(type);
                        // Si on passe à gradient, réinitialiser l'index
                        if (type === "gradient") {
                          setBackgroundImageIndex(null);
                        }
                        // Si on passe à image et qu'il y a une cover, la sélectionner par défaut
                        if (type === "image" && coverImage && backgroundImageIndex === null) {
                          // Garder null pour indiquer que c'est la cover
                        } else if (type === "image" && images.length > 0 && backgroundImageIndex === null) {
                          // Si pas de cover mais des images, sélectionner la première
                          setBackgroundImageIndex(0);
                        }
                      }}
                      onBackgroundImageIndexChange={(index) => {
                        if (index === null) {
                          setBackgroundImageIndex(null);
                        } else if (coverImage && index === 0) {
                          // Index 0 = cover
                          setBackgroundImageIndex(null);
                        } else if (coverImage && index > 0) {
                          // Index > 0 = image de la galerie (index - 1 dans le tableau images)
                          setBackgroundImageIndex(index - 1);
                        } else {
                          // Pas de cover, index direct dans images
                          setBackgroundImageIndex(index);
                        }
                        setBackgroundType("image");
                      }}
                      onBackgroundGradientChange={setBackgroundGradient}
                      showPreview={true}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                  <CardDescription>
                    Informations de contact pour les participants
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
                      Billetterie, page Facebook, etc.
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
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer les modifications"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/business/events/${resolvedParams.eventId}`)}
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
            </TabsContent>

            <TabsContent value="planning" className="mt-6">
              <div className="space-y-6">
                {/* Message d'avertissement si les dates ne sont pas renseignées */}
                {(!startDate || !startTime) && (
                  <Card className="border-orange-500/50 bg-orange-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                            Dates et horaires requis
                          </h4>
                          <p className="text-sm text-orange-800 dark:text-orange-200">
                            Pour créer un planning, vous devez d&apos;abord renseigner la <strong>date de début</strong> et l&apos;<strong>heure de début</strong> de votre événement dans l&apos;onglet &quot;Informations&quot;.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => {
                              // Trouver l'onglet informations et le sélectionner
                              const informationsTab = document.querySelector('[value="informations"]') as HTMLElement;
                              if (informationsTab) {
                                informationsTab.click();
                              }
                            }}
                          >
                            Aller à l&apos;onglet Informations
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Activation du planning */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Planning de l&apos;événement
                        </CardTitle>
                        <CardDescription>
                          Créez des créneaux horaires pour organiser les inscriptions
                        </CardDescription>
                      </div>
                      <PlanningInfoDialog />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="planning-enabled" className="text-base">
                          Activer le planning
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Les participants devront choisir un créneau lors de
                          l&apos;inscription
                        </p>
                      </div>
                      <Switch
                        id="planning-enabled"
                        checked={planningEnabled}
                        onCheckedChange={setPlanningEnabled}
                      />
                    </div>

                    {planningEnabled && (
                      <>
                        <Separator />
                        
                        {/* Configuration de la durée */}
                        <div className="flex items-end gap-4">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="slot-duration">
                              Durée des créneaux (minutes)
                            </Label>
                            <Input
                              id="slot-duration"
                              type="number"
                              min="15"
                              step="15"
                              value={slotDuration}
                              onChange={(e) => setSlotDuration(e.target.value)}
                              placeholder="60"
                            />
                            <p className="text-xs text-muted-foreground">
                              Durée minimale : 15 minutes
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={generateSlots}
                            disabled={!startDate || !startTime}
                            className="h-10"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Générer automatiquement
                          </Button>
                        </div>

                        <Separator />

                        {/* Calendrier de planning */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-1">
                              Planning ({slots.length} créneau{slots.length > 1 ? "x" : ""})
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {startDate && startTime
                                ? "Cliquez sur une heure pour ajouter un créneau, ou utilisez le bouton \"Générer automatiquement\""
                                : "Veuillez d'abord définir la date et l'heure de début de l'événement pour afficher le calendrier"}
                            </p>
                          </div>
                          
                          {startDate && startTime ? (
                            <EventPlanningCalendar
                              slots={slots}
                              onSlotsChange={setSlots}
                              eventStartDate={
                                startDate && startTime
                                  ? new Date(`${startDate}T${startTime}`)
                                  : new Date()
                              }
                              eventEndDate={
                                endDate && endTime
                                  ? new Date(`${endDate}T${endTime}`)
                                  : endTime
                                  ? new Date(`${startDate}T${endTime}`)
                                  : startDate && startTime
                                  ? new Date(`${startDate}T${startTime}`)
                                  : new Date()
                              }
                              slotDurationMinutes={parseInt(slotDuration) || 60}
                            />
                          ) : (
                            <Card>
                              <CardContent className="p-8 text-center">
                                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                  Veuillez d&apos;abord définir la date et l&apos;heure de début de l&apos;événement dans l&apos;onglet &quot;Informations&quot; pour afficher le calendrier.
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
