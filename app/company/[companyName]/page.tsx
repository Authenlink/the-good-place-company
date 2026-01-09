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

interface CompanyData {
  id: number;
  name: string;
  description: string;
  logo: string;
  background: string;
  address: string;
  city: string;
  coordinates: { lat: number; lng: number };
  email: string;
  phone: string;
  website: string;
  founded: string;
  size: string;
  createdAt: string;
  areaId: number;
  values: string[];
  area: {
    name: string;
  };
}

export default function CompanyPage() {
  const params = useParams();
  const router = useRouter();
  const hasScrolled = useScroll();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const companyName = params.companyName as string;

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/companies/${encodeURIComponent(companyName)}`
        );

        if (response.status === 404) {
          setError("Entreprise non trouvée");
          return;
        }

        if (!response.ok) {
          throw new Error("Erreur lors du chargement de l'entreprise");
        }

        const data = await response.json();
        setCompanyData(data.company);
      } catch (error) {
        console.error("Erreur:", error);
        setError(
          "Une erreur s'est produite lors du chargement de l'entreprise"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (companyName) {
      loadCompanyData();
    }
  }, [companyName]);

  // Mock data for areas and values (à adapter selon vos données)
  const availableValues = [
    { id: "1", name: "Innovation", color: "bg-blue-500" },
    { id: "2", name: "Durabilité", color: "bg-green-500" },
    { id: "3", name: "Excellence", color: "bg-purple-500" },
    { id: "4", name: "Intégrité", color: "bg-red-500" },
    { id: "5", name: "Collaboration", color: "bg-orange-500" },
    { id: "6", name: "Responsabilité sociale", color: "bg-teal-500" },
    { id: "7", name: "Transparence", color: "bg-indigo-500" },
    { id: "8", name: "Qualité", color: "bg-pink-500" },
  ];

  const selectedValues = availableValues.filter((value) =>
    companyData?.values?.includes(value.id)
  );

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
                    <BreadcrumbPage>Entreprise</BreadcrumbPage>
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

  if (!companyData) {
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
                  <BreadcrumbPage>{companyData.name}</BreadcrumbPage>
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
                <h1 className="text-3xl font-bold">{companyData.name}</h1>
                <p className="text-muted-foreground mt-1">
                  Découvrez cette entreprise et ses activités
                </p>
              </div>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
          </div>

          {/* Company Background and Header */}
          <Card className="mb-6">
            <CardHeader className="pb-0">
              {/* Background Image */}
              <div className="relative h-48 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
                {companyData.background && (
                  <Image
                    src={companyData.background}
                    alt="Background"
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              {/* Logo and Basic Info */}
              <div className="flex items-start gap-4 -mt-16 relative z-10">
                <Avatar className="h-24 w-24 border-4 border-background">
                  <AvatarImage src={companyData.logo} alt={companyData.name} />
                  <AvatarFallback className="text-lg">
                    {companyData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 pt-12">
                  <CardTitle className="text-2xl mb-2">
                    {companyData.name}
                  </CardTitle>
                  <div className="mb-3">
                    <p className="text-muted-foreground whitespace-pre-line">
                      {showFullDescription ||
                      companyData.description.length <= 200
                        ? companyData.description
                        : `${companyData.description.substring(0, 200)}...`}
                    </p>
                    {companyData.description.length > 200 && (
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
                    {companyData.area?.name && (
                      <Badge variant="secondary">{companyData.area.name}</Badge>
                    )}
                    {companyData.size && (
                      <Badge variant="outline">{companyData.size}</Badge>
                    )}
                    {selectedValues.map((value) => (
                      <Badge
                        key={value.id}
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

          {/* Company Information Grid */}
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
                      {companyData.email || "Non spécifié"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Téléphone</p>
                    <p className="text-sm text-muted-foreground">
                      {companyData.phone || "Non spécifié"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Adresse</p>
                    <p className="text-sm text-muted-foreground">
                      {companyData.address && companyData.city
                        ? `${companyData.address}, ${companyData.city}`
                        : companyData.address ||
                          companyData.city ||
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
                    {companyData.website ? (
                      <a
                        href={companyData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {companyData.website}
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
                      {companyData.founded || "Non spécifiée"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques de l&apos;entreprise</CardTitle>
              <CardDescription>
                Aperçu des métriques clés de cette entreprise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">
                    Événements actifs
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">
                    Projets en cours
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
