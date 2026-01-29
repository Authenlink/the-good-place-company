"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import { useToast } from "@/hooks/use-toast";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useScroll } from "@/hooks/use-scroll";
import {
  MapPin,
  Globe,
  Calendar,
  Building2,
  ExternalLink,
  Mail,
  Phone,
  Target,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  Users,
} from "lucide-react";
import { EVENT_TYPES, MEMBER_TYPES } from "@/lib/schema";
import { cn } from "@/lib/utils";

// Composants d'icônes pour les réseaux sociaux
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

interface AssociationData {
  id: number;
  name: string;
  description: string;
  logo: string | null;
  banner: string | null;
  background: string | null;
  backgroundType: "image" | "gradient" | null;
  backgroundGradient: {
    color1: string;
    color2: string;
    css: string;
  } | null;
  address: string | null;
  city: string | null;
  coordinates: { lat: number; lng: number } | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  founded: string | null;
  size: string | null;
  category: string;
  values: { name: string; color: string }[];
  isOnline: boolean;
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  createdAt: string;
  isFollowing?: boolean;
  isOwner?: boolean;
  events: Array<{
    id: number;
    title: string;
    description: string | null;
    eventType: string;
    startDate: Date;
    endDate: Date | null;
    location: string | null;
    city: string | null;
    images: string[] | null;
    coverImage: string | null;
    status: string;
  }>;
  projects: Array<{
    id: number;
    title: string;
    shortDescription: string | null;
    fullDescription: string | null;
    bannerImage: string | null;
    tags: string[] | null;
    customTags: string[] | null;
    status: string;
    createdAt: Date;
  }>;
}

export default function AssociationPage({
  params,
}: {
  params: Promise<{ associationName: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [association, setAssociation] = useState<AssociationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const hasScrolled = useScroll();

  useEffect(() => {
    const fetchAssociation = async () => {
      try {
        const response = await fetch(
          `/api/associations/${encodeURIComponent(resolvedParams.associationName)}`
        );
        if (response.ok) {
          const data = await response.json();
          setAssociation(data.association);
          setIsFollowing(data.association.isFollowing || false);
          setIsOwner(data.association.isOwner === true);
        } else if (response.status === 404) {
          router.push("/associations");
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'association:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssociation();
  }, [resolvedParams.associationName, router]);

  const handleFollowToggle = async () => {
    if (!session?.user || session.user.accountType !== "user") {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour suivre une association.",
        variant: "destructive",
      });
      return;
    }

    if (!association) return;

    setIsTogglingFollow(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const response = await fetch(
        `/api/companies/follow/${association.id}`,
        {
          method,
        }
      );

      if (response.ok) {
        setIsFollowing(!isFollowing);
        toast({
          title: isFollowing ? "Désabonnement réussi" : "Abonnement réussi",
          description: isFollowing
            ? "Vous ne suivez plus cette association."
            : "Vous suivez maintenant cette association.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Une erreur s'est produite.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors du toggle follow:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'opération.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingFollow(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <DynamicSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-4 w-32" />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!association) {
    return null;
  }

  const bannerStyle =
    association.backgroundType === "gradient" && association.backgroundGradient
      ? { background: association.backgroundGradient.css }
      : association.banner || association.background
      ? {}
      : { background: "linear-gradient(to bottom, #f3f4f6, #ffffff)" };

  return (
    <SidebarProvider>
      <DynamicSidebar />
      <SidebarInset>
        <header
          className={cn(
            "sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
            hasScrolled ? "border-b" : ""
          )}
        >
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/associations">
                    Associations
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{association.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          {/* Banner */}
          <div className="relative h-48 w-full" style={bannerStyle}>
            {association.backgroundType === "image" &&
              (association.banner || association.background) && (
                <Image
                  src={association.banner || association.background || ""}
                  alt="Banner"
                  fill
                  className="object-cover"
                />
              )}
          </div>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            {/* Association Header */}
            <div className="flex flex-col md:flex-row gap-4 -mt-16">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={association.logo || ""} />
                <AvatarFallback>
                  {association.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pt-20 md:pt-24">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">{association.name}</h1>
                    {association.isOnline && (
                      <Badge
                        variant="outline"
                        className="mt-2 bg-green-500/10 text-green-600 border-green-500/20"
                      >
                        En ligne
                      </Badge>
                    )}
                  </div>
                  {session?.user && session.user.accountType === "user" && (
                    <Button
                      onClick={handleFollowToggle}
                      disabled={isTogglingFollow}
                      variant={isFollowing ? "outline" : "default"}
                    >
                      {isTogglingFollow
                        ? "Chargement..."
                        : isFollowing
                        ? "Ne plus suivre"
                        : "Suivre"}
                    </Button>
                  )}
                </div>
                {association.description && (
                  <div className="mt-4">
                    <p
                      className={cn(
                        "text-muted-foreground whitespace-pre-wrap",
                        !showFullDescription && "line-clamp-5"
                      )}
                    >
                      {association.description}
                    </p>
                    {association.description.split("\n").length > 5 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2 h-auto p-0 text-xs"
                        onClick={() => setShowFullDescription(!showFullDescription)}
                      >
                        {showFullDescription ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Voir moins
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Voir plus
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-4 mt-4">
                  {association.city && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {association.city}
                    </div>
                  )}
                  {association.website && (
                    <a
                      href={association.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      Site web
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {(association.instagramUrl ||
                    association.tiktokUrl ||
                    association.linkedinUrl) && (
                    <div className="flex items-center gap-3">
                      {association.instagramUrl && (
                        <a
                          href={association.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <InstagramIcon className="h-5 w-5" />
                        </a>
                      )}
                      {association.tiktokUrl && (
                        <a
                          href={association.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <TikTokIcon className="h-5 w-5" />
                        </a>
                      )}
                      {association.linkedinUrl && (
                        <a
                          href={association.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <LinkedInIcon className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {association.values.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {association.values.map((value, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={cn(
                          "text-white border-transparent",
                          value.color
                        )}
                      >
                        {value.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Onglets */}
            <Tabs defaultValue="info" className="w-full">
              <TabsList>
                <TabsTrigger value="info">Informations générales</TabsTrigger>
                {session?.user && (
                  <TabsTrigger value="members">Liste des membres</TabsTrigger>
                )}
              </TabsList>

              {/* Onglet Informations générales */}
              <TabsContent value="info" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                {/* Événements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Événements ({association.events.length})
                    </CardTitle>
                    <CardDescription>
                      Événements organisés par cette association
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {association.events.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun événement pour le moment
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {association.events.map((event) => {
                          const startDate = new Date(event.startDate);
                          return (
                            <Link
                              key={event.id}
                              href={`/events/${event.id}`}
                              className="block"
                            >
                              <Card className="hover:bg-accent transition-colors cursor-pointer">
                                <CardContent className="p-4">
                                  <div className="flex gap-4">
                                    {event.coverImage && (
                                      <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden">
                                        <Image
                                          src={event.coverImage}
                                          alt={event.title}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold truncate">
                                          {event.title}
                                        </h3>
                                        <Badge
                                          variant="outline"
                                          className="flex-shrink-0"
                                        >
                                          {EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] || event.eventType}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-4 w-4" />
                                          {format(startDate, "d MMM yyyy", {
                                            locale: fr,
                                          })}
                                        </div>
                                        {event.city && (
                                          <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {event.city}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Projets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Projets ({association.projects.length})
                    </CardTitle>
                    <CardDescription>
                      Projets portés par cette association
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {association.projects.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun projet pour le moment
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {association.projects.map((project) => (
                          <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="block"
                          >
                            <Card className="hover:bg-accent transition-colors cursor-pointer">
                              <CardContent className="p-4">
                                <div className="flex gap-4">
                                  {project.bannerImage && (
                                    <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden">
                                      <Image
                                        src={project.bannerImage}
                                        alt={project.title}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">
                                      {project.title}
                                    </h3>
                                    {(project.shortDescription ||
                                      project.fullDescription) && (
                                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                        {project.shortDescription ||
                                          project.fullDescription}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Colonne latérale */}
              <div className="space-y-6">
                {/* Informations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {association.category && (
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Secteur</p>
                          <p className="text-sm text-muted-foreground">
                            {association.category}
                          </p>
                        </div>
                      </div>
                    )}
                    {association.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <a
                            href={`mailto:${association.email}`}
                            className="text-sm text-muted-foreground hover:text-foreground"
                          >
                            {association.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {association.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Téléphone</p>
                          <a
                            href={`tel:${association.phone}`}
                            className="text-sm text-muted-foreground hover:text-foreground"
                          >
                            {association.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {association.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Adresse</p>
                          <p className="text-sm text-muted-foreground">
                            {association.address}
                            {association.city && `, ${association.city}`}
                          </p>
                        </div>
                      </div>
                    )}
                    {association.founded && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Fondée en</p>
                          <p className="text-sm text-muted-foreground">
                            {association.founded}
                          </p>
                        </div>
                      </div>
                    )}
                    {association.size && (
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Taille</p>
                          <p className="text-sm text-muted-foreground">
                            {association.size}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        Membre depuis
                      </span>
                      <span className="text-sm">
                        {format(new Date(association.createdAt), "MMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
                </div>
              </TabsContent>

              {/* Onglet Membres */}
              {session?.user && (
                <TabsContent value="members" className="mt-6">
                  <MembersList associationName={association.name} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Composant pour la liste des membres
function MembersList({ associationName }: { associationName: string }) {
  const [members, setMembers] = useState<Array<{
    id: number;
    name: string | null;
    email: string;
    image: string | null;
    memberType: "volunteer" | "permanent_member";
    joinedAt: Date;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberType, setSelectedMemberType] = useState<string>("all");

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) {
          params.append("search", searchTerm.trim());
        }
        if (selectedMemberType !== "all") {
          params.append("memberType", selectedMemberType);
        }

        const response = await fetch(
          `/api/associations/${encodeURIComponent(associationName)}/members?${params.toString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des membres:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [associationName, searchTerm, selectedMemberType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membres de l'association</CardTitle>
        <CardDescription>
          Liste des personnes qui participent à cette association
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={selectedMemberType}
            onValueChange={setSelectedMemberType}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="volunteer">{MEMBER_TYPES.volunteer}</SelectItem>
              <SelectItem value="permanent_member">{MEMBER_TYPES.permanent_member}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des membres */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
            <span className="text-muted-foreground">Chargement...</span>
          </div>
        ) : members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <Link
                key={member.id}
                href={`/user/${member.id}`}
                className="block"
              >
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.image || ""} alt={member.name || ""} />
                        <AvatarFallback>
                          {member.name
                            ? member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate hover:underline">
                          {member.name || "Utilisateur"}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {member.email}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {MEMBER_TYPES[member.memberType]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(member.joinedAt), "MMM yyyy", {
                              locale: fr,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm || selectedMemberType !== "all"
                ? "Aucun membre trouvé"
                : "Aucun membre pour le moment"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
