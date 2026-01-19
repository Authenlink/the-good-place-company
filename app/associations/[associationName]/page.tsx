"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useScroll } from "@/hooks/use-scroll";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent, CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  ArrowLeft,
} from "lucide-react";

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
  logo: string;
  banner: string;
  background: string;
  backgroundType?: "image" | "gradient" | null;
  backgroundGradient?: {
    color1: string;
    color2: string;
    css: string;
  } | null;
  address: string;
  city: string;
  coordinates: { lat: number; lng: number };
  email: string;
  phone: string;
  website: string;
  founded: string;
  size: string;
  category: string;
  createdAt: string;
  values: { name: string; color: string }[];
  isOnline?: boolean;
  instagramUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
}

export default function AssociationPage() {
  const params = useParams();
  const router = useRouter();
  const hasScrolled = useScroll();
  const [associationData, setAssociationData] =
    useState<AssociationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const associationName = params.associationName as string;

  useEffect(() => {
    const loadAssociationData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/associations/${encodeURIComponent(associationName)}`
        );

        if (response.status === 404) {
          setError("Association non trouvée");
          return;
        }

        if (!response.ok) {
          throw new Error("Erreur lors du chargement de l'association");
        }

        const data = await response.json();
        setAssociationData(data.association);
      } catch (error) {
        console.error("Erreur:", error);
        setError(
          "Une erreur s'est produite lors du chargement de l'association"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (associationName) {
      loadAssociationData();
    }
  }, [associationName]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <DynamicSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <div className="text-sm text-muted-foreground">Chargement...</div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="mb-6">
              <Skeleton className="h-6 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>

            <Card className="overflow-hidden p-0">
              <Skeleton className="h-32 w-full" />
              <CardHeader className="pb-0">
                <div className="flex items-start gap-4 -mt-12 relative z-10">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="flex-1 pt-8">
                    <Skeleton className="h-6 w-64 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <DynamicSidebar />
        <SidebarInset>
          <header
            className={`sticky top-0 z-10 flex h-16 shrink-0 items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ${
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
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/associations">
                      Associations
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Association</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-destructive mb-4">
                {error}
              </h1>
              <Button onClick={() => router.push("/associations")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux associations
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!associationData) {
    return null;
  }

  return (
    <SidebarProvider>
      <DynamicSidebar />
      <SidebarInset>
        <header
          className={`sticky top-0 z-10 flex h-16 shrink-0 items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ${
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
                <BreadcrumbItem>
                  <BreadcrumbLink href="/associations">
                    Associations
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>&gt;</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{associationData.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">{associationData.name}</h1>
                <p className="text-muted-foreground">
                  Découvrez cette association et ses activités solidaires
                </p>
              </div>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
          </div>

          {/* Association Background and Header */}
          <Card className="overflow-hidden p-0">
            {/* Background Image or Gradient */}
            <div className="relative h-32 w-full">
              {associationData.backgroundType === "gradient" && associationData.backgroundGradient ? (
                <div
                  className="w-full h-full"
                  style={{
                    background: associationData.backgroundGradient.css,
                  }}
                />
              ) : associationData.background || associationData.banner ? (
                <Image
                  src={associationData.background || associationData.banner}
                  alt="Background"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
              )}
            </div>

            <CardHeader className="pb-0">
              {/* Logo and Basic Info */}
              <div className="flex items-start gap-4 -mt-12 relative z-10">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-background">
                    <AvatarImage
                      src={associationData.logo}
                      alt={associationData.name}
                    />
                    <AvatarFallback className="text-lg">
                      {associationData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Indicateur de présence en ligne */}
                  {associationData.isOnline !== undefined && (
                    <div
                      className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-4 border-background ${
                        associationData.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                      title={associationData.isOnline ? "En ligne" : "Hors ligne"}
                    />
                  )}
                </div>
                <div className="flex-1 pt-8">
                  <CardTitle className="text-xl mb-2">{associationData.name}</CardTitle>
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {showFullDescription ||
                      associationData.description.length <= 150
                        ? associationData.description
                        : `${associationData.description.substring(0, 150)}...`}
                    </p>
                    {associationData.description.length > 150 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs mt-1"
                        onClick={() =>
                          setShowFullDescription(!showFullDescription)
                        }
                      >
                        {showFullDescription ? "Voir moins" : "Voir plus"}
                      </Button>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      Association créée en{" "}
                      {new Date(associationData.createdAt).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {associationData.category && (
                      <Badge variant="secondary">{associationData.category}</Badge>
                    )}
                    {associationData.size && (
                      <Badge variant="outline">{associationData.size}</Badge>
                    )}
                    {associationData.values?.map((value, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={`${value.color} text-white border-transparent`}
                      >
                        {value.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Association Information Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {associationData.email || "Non spécifié"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Téléphone</p>
                    <p className="text-sm text-muted-foreground">
                      {associationData.phone || "Non spécifié"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Adresse</p>
                    <p className="text-sm text-muted-foreground">
                      {associationData.address && associationData.city
                        ? `${associationData.address}, ${associationData.city}`
                        : associationData.address ||
                          associationData.city ||
                          "Non spécifiée"}
                    </p>
                  </div>
                </div>
                {associationData.category && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Secteur</p>
                      <p className="text-sm text-muted-foreground">
                        {associationData.category}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Présence en ligne
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {associationData.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Site web</p>
                      <a
                        href={associationData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        {associationData.website}
                      </a>
                    </div>
                  </div>
                )}
                {associationData.founded && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Fondée en</p>
                      <p className="text-sm text-muted-foreground">
                        {associationData.founded}
                      </p>
                    </div>
                  </div>
                )}
                {(associationData.instagramUrl || associationData.tiktokUrl || associationData.linkedinUrl) && (
                  <div className="flex items-center gap-4 pt-2">
                    {associationData.instagramUrl && (
                      <a
                        href={associationData.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-pink-600 transition-colors"
                        title="Instagram"
                      >
                        <InstagramIcon className="h-5 w-5" />
                      </a>
                    )}
                    {associationData.tiktokUrl && (
                      <a
                        href={associationData.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-black transition-colors"
                        title="TikTok"
                      >
                        <TikTokIcon className="h-5 w-5" />
                      </a>
                    )}
                    {associationData.linkedinUrl && (
                      <a
                        href={associationData.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-blue-600 transition-colors"
                        title="LinkedIn"
                      >
                        <LinkedInIcon className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
