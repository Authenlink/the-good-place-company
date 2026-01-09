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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  ExternalLink,
} from "lucide-react";

interface AssociationData {
  id: number;
  name: string;
  description: string;
  logo: string;
  banner: string;
  address: string;
  city: string;
  coordinates: { lat: number; lng: number };
  email: string;
  phone: string;
  website: string;
  founded: string;
  category: string;
  createdAt: string;
  values: { name: string; color: string }[];
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

            <Card className="mb-6">
              <CardHeader className="pb-0">
                <Skeleton className="h-32 w-full rounded-lg mb-4" />
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 -mt-12 relative z-10">
                  <div className="flex justify-center sm:justify-start">
                    <Skeleton className="h-24 w-24 rounded-full" />
                  </div>
                  <div className="flex-1 text-center sm:text-left sm:pt-12">
                    <Skeleton className="h-8 w-64 mb-3 mx-auto sm:mx-0" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mx-auto sm:mx-0" />
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
          {/* Header avec titre */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{associationData.name}</h1>
                <p className="text-muted-foreground mt-1">
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
          <Card className="mb-6">
            <CardHeader className="pb-0">
              {/* Background Image */}
              <div className="relative h-48 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
                {associationData.banner && (
                  <Image
                    src={associationData.banner}
                    alt="Background"
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              {/* Logo and Basic Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 -mt-16 relative z-10">
                {/* Logo centré sur mobile, à gauche sur desktop */}
                <div className="flex justify-center sm:justify-start">
                  <Avatar className="h-24 w-24 border-4 border-background">
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
                </div>

                {/* Informations sous le logo sur mobile, à côté sur desktop */}
                <div className="flex-1 text-center sm:text-left sm:pt-12">
                  <CardTitle className="text-2xl mb-3">
                    {associationData.name}
                  </CardTitle>
                  <div className="mb-3">
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {showFullDescription ||
                      associationData.description.length <= 150
                        ? associationData.description
                        : `${associationData.description.substring(0, 150)}...`}
                    </p>
                    {associationData.description.length > 150 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs mt-2"
                        onClick={() =>
                          setShowFullDescription(!showFullDescription)
                        }
                      >
                        {showFullDescription ? "Voir moins" : "Voir plus"}
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {associationData.category}
                    </Badge>
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
          <div className="grid gap-6 md:grid-cols-2 mb-6">
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
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Site web</p>
                    {associationData.website ? (
                      <a
                        href={associationData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {associationData.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Non spécifié
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fondée en</p>
                    <p className="text-sm text-muted-foreground">
                      {associationData.founded || "Non spécifiée"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Association Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques de l&apos;association</CardTitle>
              <CardDescription>
                Aperçu des métriques clés de cette association
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">
                    Projets actifs
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">
                    Membres actifs
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">Abonnés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
