"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Globe,
  Users,
  Search,
} from "lucide-react";
import { useScroll } from "@/hooks/use-scroll";
import MapVariants from "@/components/map-variants";

interface Company {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  coordinates?: { lat: number; lng: number }; // Coordonnées GPS directes
  logo?: string;
  website?: string;
  size?: string;
  area?: {
    name: string;
  };
  values?: string[];
}

interface CityCount {
  city: string;
  count: number;
}

function MapPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cityParam = searchParams.get("city");
  const hasScrolled = useScroll();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [cityCounts, setCityCounts] = useState<CityCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (cityParam) {
      fetchCompaniesByCity(cityParam);
    } else {
      fetchCityCounts();
      fetchAllCompanies();
    }
  }, [cityParam]);

  const fetchCompaniesByCity = async (city: string) => {
    try {
      setLoading(true);
      console.log(`🔍 Chargement des entreprises pour: ${city}`);
      const response = await fetch(
        `/api/companies/city/${encodeURIComponent(city)}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Données reçues:`, data);
        setCompanies(data.companies || []);
        setCityCounts([]); // Vider les comptages quand on affiche une ville spécifique
      } else {
        console.error(`❌ Erreur API: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des entreprises:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCompanies = async () => {
    try {
      console.log(`🔍 Chargement de toutes les associations`);
      const response = await fetch(`/api/companies`);

      if (response.ok) {
        const data = await response.json();
        console.log(
          `📊 Toutes les associations reçues: ${data.companies?.length || 0}`
        );
        setAllCompanies(data.companies || []);
      } else {
        console.error(`❌ Erreur API: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des associations:", error);
    }
  };

  const fetchCityCounts = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Chargement des comptages par ville`);
      const response = await fetch(`/api/companies/cities/count`);

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Comptages reçus:`, data);
        setCityCounts(data.cities || []);
        setCompanies([]); // Vider les entreprises quand on affiche les villes
      } else {
        console.error(`❌ Erreur API: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des comptages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDiscover = () => {
    router.push("/discover");
  };

  // Filtrer les associations selon la recherche
  const filteredCompanies = allCompanies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <BreadcrumbLink href="/feed">Accueil</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>&gt;</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/discover">Découvrir</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>&gt;</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    Carte - {cityParam || "France"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">
                Carte des associations
                {cityParam && (
                  <span className="text-primary"> à {cityParam}</span>
                )}
              </h1>
              <p className="text-muted-foreground">
                {cityParam
                  ? "Découvrez les acteurs engagés de la région"
                  : "Découvrez les associations engagées sur la plateforme"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleBackToDiscover}
              className="hidden sm:flex"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la découverte
            </Button>
          </div>

          <div className="flex flex-1 flex-col xl:flex-row gap-6 min-h-0 overflow-hidden">
            {/* Liste des associations */}
            <div className="w-full xl:w-96 flex flex-col shrink-0">
              <Card className="flex flex-col h-[500px] xl:h-full shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                    Associations {cityParam && `à ${cityParam}`}
                    {(cityParam ? companies.length : filteredCompanies.length) >
                      0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {cityParam
                          ? companies.length
                          : filteredCompanies.length}
                      </Badge>
                    )}
                  </CardTitle>
                  {!cityParam && (
                    <div className="pt-2 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Rechercher une association..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  {loading ? (
                    <div className="space-y-4 p-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50">
                            <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (cityParam
                      ? companies.length
                      : filteredCompanies.length) > 0 ? (
                    <div className="h-full overflow-y-auto p-4 pt-0">
                      <div className="space-y-3">
                        {(cityParam ? companies : filteredCompanies).map(
                          (company, index) => (
                            <div key={company.id}>
                              <div
                                className="group p-4 rounded-lg border border-border hover:border-primary/20 hover:shadow-md cursor-pointer transition-all duration-200 bg-card hover:bg-accent/5"
                                onClick={() =>
                                  router.push(
                                    `/associations/${encodeURIComponent(
                                      company.name
                                    )}`
                                  )
                                }
                              >
                                <div className="flex items-start gap-3">
                                  {company.logo ? (
                                    <Image
                                      src={company.logo}
                                      alt={company.name}
                                      width={48}
                                      height={48}
                                      className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-border flex-shrink-0">
                                      <Building2 className="h-6 w-6 text-primary" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                      <h4 className="font-semibold text-sm text-card-foreground group-hover:text-primary transition-colors truncate">
                                        {company.name}
                                      </h4>
                                      {company.area?.name && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] ml-2 flex-shrink-0"
                                        >
                                          {company.area.name}
                                        </Badge>
                                      )}
                                    </div>

                                    {company.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                                        {company.description}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                                      <MapPin className="w-3 h-3" />
                                      <span className="truncate">
                                        {company.address ||
                                          `${company.city}, France`}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                        {company.website && (
                                          <div className="flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            <span>Site web</span>
                                          </div>
                                        )}
                                        {company.size && (
                                          <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            <span>{company.size}</span>
                                          </div>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          router.push(
                                            `/associations/${encodeURIComponent(
                                              company.name
                                            )}`
                                          );
                                        }}
                                      >
                                        En savoir plus
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {index < companies.length - 1 && (
                                <Separator className="my-2" />
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-card-foreground mb-2">
                        Aucune association trouvée
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {cityParam
                          ? `Il n'y a pas encore d'associations enregistrées à ${cityParam}`
                          : searchQuery
                          ? `Aucune association ne correspond à "${searchQuery}"`
                          : "Aucune association n'est encore enregistrée"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Carte */}
            <div className="flex-1 min-h-[500px] xl:min-h-0 relative">
              <Card className="shadow-sm overflow-hidden h-full flex flex-col">
                <div className="flex-1 relative rounded-lg overflow-hidden px-4">
                  <Suspense
                    fallback={
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-primary animate-pulse" />
                          </div>
                          <p className="text-gray-600 font-medium">
                            Chargement de la carte...
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <MapVariants
                      companies={companies}
                      cityCounts={cityCounts}
                      variant="dark"
                      markerStyle="default"
                      popupStyle="detailed"
                      city={cityParam}
                      className="h-full"
                    />
                  </Suspense>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div>Chargement de la carte...</div>}>
      <MapPageContent />
    </Suspense>
  );
}
