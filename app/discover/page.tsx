"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useScroll } from "@/hooks/use-scroll";

interface City {
  name: string;
  color: string;
  population: number;
}

const cities: City[] = [
  {
    name: "Paris",
    color: "bg-gradient-to-br from-red-500 to-pink-600",
    population: 2161000,
  },
  {
    name: "Marseille",
    color: "bg-gradient-to-br from-blue-500 to-cyan-600",
    population: 870321,
  },
  {
    name: "Lyon",
    color: "bg-gradient-to-br from-green-500 to-emerald-600",
    population: 522250,
  },
  {
    name: "Toulouse",
    color: "bg-gradient-to-br from-purple-500 to-violet-600",
    population: 498003,
  },
  {
    name: "Nice",
    color: "bg-gradient-to-br from-yellow-500 to-orange-600",
    population: 342669,
  },
  {
    name: "Nantes",
    color: "bg-gradient-to-br from-indigo-500 to-blue-600",
    population: 323204,
  },
  {
    name: "Strasbourg",
    color: "bg-gradient-to-br from-pink-500 to-rose-600",
    population: 291313,
  },
  {
    name: "Montpellier",
    color: "bg-gradient-to-br from-teal-500 to-green-600",
    population: 302454,
  },
  {
    name: "Bordeaux",
    color: "bg-gradient-to-br from-orange-500 to-red-600",
    population: 260958,
  },
  {
    name: "Lille",
    color: "bg-gradient-to-br from-cyan-500 to-blue-600",
    population: 236234,
  },
  {
    name: "Rennes",
    color: "bg-gradient-to-br from-lime-500 to-green-600",
    population: 223347,
  },
  {
    name: "Reims",
    color: "bg-gradient-to-br from-emerald-500 to-teal-600",
    population: 182460,
  },
  {
    name: "Saint-Étienne",
    color: "bg-gradient-to-br from-violet-500 to-purple-600",
    population: 173089,
  },
  {
    name: "Toulon",
    color: "bg-gradient-to-br from-rose-500 to-pink-600",
    population: 176198,
  },
  {
    name: "Grenoble",
    color: "bg-gradient-to-br from-blue-500 to-indigo-600",
    population: 158346,
  },
  {
    name: "Dijon",
    color: "bg-gradient-to-br from-green-500 to-lime-600",
    population: 158002,
  },
  {
    name: "Angers",
    color: "bg-gradient-to-br from-purple-500 to-indigo-600",
    population: 157175,
  },
  {
    name: "Villeurbanne",
    color: "bg-gradient-to-br from-yellow-500 to-amber-600",
    population: 154781,
  },
  {
    name: "Saint-Denis",
    color: "bg-gradient-to-br from-indigo-500 to-purple-600",
    population: 112091,
  },
  {
    name: "Le Mans",
    color: "bg-gradient-to-br from-cyan-500 to-teal-600",
    population: 145004,
  },
  {
    name: "Aix-en-Provence",
    color: "bg-gradient-to-br from-pink-500 to-red-600",
    population: 147122,
  },
  {
    name: "Clermont-Ferrand",
    color: "bg-gradient-to-br from-teal-500 to-cyan-600",
    population: 147327,
  },
  {
    name: "Brest",
    color: "bg-gradient-to-br from-orange-500 to-yellow-600",
    population: 139676,
  },
  {
    name: "Limoges",
    color: "bg-gradient-to-br from-rose-500 to-orange-600",
    population: 128466,
  },
  {
    name: "Tours",
    color: "bg-gradient-to-br from-emerald-500 to-lime-600",
    population: 138268,
  },
];

export default function DiscoverPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const hasScrolled = useScroll();

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCityClick = (cityName: string) => {
    router.push(`/map?city=${encodeURIComponent(cityName)}`);
  };

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
                  <BreadcrumbPage>Découvrir</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-center mb-6">
                Découvrez les projets par ville
              </h1>
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Rechercher une ville..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredCities.map((city) => (
                <Card
                  key={city.name}
                  className={`${city.color} text-white cursor-pointer transition-transform hover:scale-105 hover:shadow-lg`}
                  onClick={() => handleCityClick(city.name)}
                >
                  <CardContent className="p-6 h-32 flex items-start justify-start">
                    <h3 className="text-2xl font-bold">{city.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCities.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Aucune ville trouvée pour &quot;{searchTerm}&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
