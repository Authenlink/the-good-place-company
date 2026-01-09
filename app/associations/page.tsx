"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useScroll } from "@/hooks/use-scroll";
import { Users, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface Association {
  id: number;
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  category: string;
  location: string;
  website?: string;
  values?: { name: string; color: string }[];
  createdAt: string;
}

export default function AssociationsPage() {
  const router = useRouter();
  const hasScrolled = useScroll();
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);

  const handleViewAssociation = (associationName: string) => {
    router.push(`/associations/${encodeURIComponent(associationName)}`);
  };

  useEffect(() => {
    const fetchAssociations = async () => {
      try {
        const categoryParam =
          selectedFilter !== "all"
            ? `?category=${encodeURIComponent(selectedFilter)}`
            : "";
        const response = await fetch(`/api/associations${categoryParam}`);
        if (response.ok) {
          const data = await response.json();
          setAssociations(data);

          // Extraire les catégories uniques
          const categoriesSet = new Set<string>();
          data.forEach((assoc: Association) => {
            if (assoc.category) {
              categoriesSet.add(assoc.category);
            }
          });
          setCategories(Array.from(categoriesSet));
        } else {
          console.error("Erreur lors du chargement des associations");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des associations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssociations();
  }, [selectedFilter]);

  // Filtrage et recherche des associations
  const filteredAssociations = associations.filter((association) => {
    const matchesFilter =
      selectedFilter === "all" || association.category === selectedFilter;
    const matchesSearch =
      association.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      association.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      association.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Tri par date (plus récent en premier)
  const sortedAssociations = filteredAssociations.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading) {
    return (
      <SidebarProvider>
        <DynamicSidebar />
        <SidebarInset>
          <header
            className={`sticky top-0 z-10 flex h-16 shrink-0 items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12`}
          >
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
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Chargement des associations...
              </p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
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
                  <BreadcrumbPage>Associations</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header avec titre */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Associations</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Découvrez les associations solidaires et rejoignez leurs causes
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher une association..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtres par catégorie */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Filtrer par secteur :
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("all")}
                className="h-8"
              >
                Toutes ({associations.length})
              </Button>
              {categories.map((category) => {
                const count = associations.filter(
                  (association) => association.category === category
                ).length;
                return (
                  <Button
                    key={category}
                    variant={
                      selectedFilter === category ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedFilter(category)}
                    className="h-8"
                    disabled={count === 0}
                  >
                    {category} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Liste des associations */}
          {sortedAssociations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">
                    {selectedFilter === "all" && searchQuery === ""
                      ? "Aucune association disponible"
                      : "Aucun résultat"}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {selectedFilter === "all" && searchQuery === ""
                      ? "Il n'y a pas d'associations disponibles pour le moment."
                      : "Essayez de modifier vos critères de recherche ou de filtrage."}
                  </p>
                  {(selectedFilter !== "all" || searchQuery !== "") && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedFilter("all");
                          setSearchQuery("");
                        }}
                      >
                        Voir toutes les associations
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedAssociations.map((association) => (
                <Card
                  key={association.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow p-0"
                >
                  {/* Banner en haut, collée sans padding */}
                  <div className="h-24 bg-muted relative overflow-hidden">
                    {association.banner ? (
                      <Image
                        src={association.banner}
                        alt={`${association.name} banner`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <Users className="h-8 w-8 text-white/60" />
                      </div>
                    )}
                  </div>

                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="flex items-start gap-3 mb-4">
                      {/* Logo positionné sur la banner */}
                      <div className="w-12 h-12 bg-background border-2 border-background rounded-lg flex items-center justify-center flex-shrink-0 -mt-8 relative z-10">
                        {association.logo ? (
                          <Image
                            src={association.logo}
                            alt={`${association.name} logo`}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 -mt-6">
                        {/* Titre aligné avec le logo */}
                        <h3 className="font-bold text-lg leading-tight mt-2">
                          {association.name}
                        </h3>
                      </div>
                    </div>

                    {/* Secteur et localisation - alignés à gauche comme la description */}
                    <div className="space-y-1 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {association.category}
                      </Badge>
                      {association.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          📍 {association.location}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {association.description}
                    </p>

                    {/* Tags des valeurs en bas */}
                    {association.values && association.values.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {association.values.map((value, index) => (
                          <Badge
                            key={index}
                            className={`text-xs text-white ${value.color}`}
                          >
                            {value.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 mb-4">
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          Aucune valeur définie
                        </Badge>
                      </div>
                    )}

                    {/* Boutons d'action */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewAssociation(association.name)}
                      >
                        En savoir plus
                      </Button>
                      {association.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={association.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Site web
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
