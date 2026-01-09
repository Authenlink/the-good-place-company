"use client";

import { useState } from "react";
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
} from "@/lib/schema";

export default function CreateEventPage() {
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

  // Soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasScrolled = useScroll();

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
    if (uploadingImages) {
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
        status: "published",
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        toast({
          title: "Événement publié !",
          description: "Votre événement est maintenant visible par tous.",
        });
        router.push("/business/events");
      } else {
        const error = await response.json();
        throw new Error(
          error.error || "Erreur lors de la création de l'événement"
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description:
          "Une erreur s'est produite lors de la création de l'événement.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                  <BreadcrumbLink href="/business/events">
                    Événements
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Créer un événement</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Nouvel événement</h1>
            <p className="text-muted-foreground mt-1">
              Créez un événement pour engager votre communauté et organiser vos
              actions
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
              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Images
                  </CardTitle>
                  <CardDescription>
                    Ajoutez des visuels pour votre événement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <div className="text-center space-y-3">
                        <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
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
                        Publication...
                      </>
                    ) : (
                      "Publier l'événement"
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
