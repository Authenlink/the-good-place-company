"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Search, X } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  EventCalendar,
  EventCalendarSkeleton,
  type CalendarEvent,
} from "@/components/event-calendar";
import { EventCard } from "@/components/event-card";
import { useScroll } from "@/hooks/use-scroll";
import { EventType } from "@/lib/schema";

interface Event {
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
  status: string;
  companyId: number | null;
  companyName: string | null;
  companyLogo: string | null;
  participantCount: number;
  waitlistCount: number;
}

export default function EventsCalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasScrolled = useScroll();
  const [events, setEvents] = useState<Event[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Charger la ville de référence de l'utilisateur
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.referencedCity) {
            setSelectedCity(data.referencedCity);
            setCitySearch(data.referencedCity);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
      }
    };

    if (status === "authenticated" && session?.user?.accountType !== "business") {
      loadUserProfile();
    }
  }, [status, session]);

  // Charger les villes disponibles
  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await fetch("/api/events/cities");
        if (response.ok) {
          const data = await response.json();
          setCities(data.cities || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des villes:", error);
      }
    };

    loadCities();
  }, []);

  // Charger les événements
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const url = selectedCity
          ? `/api/events?filter=all&city=${encodeURIComponent(selectedCity)}`
          : "/api/events?filter=all";
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          // Filtrer seulement les événements publiés
          const publishedEvents = data.filter(
            (event: { status?: string }) => event.status === "published"
          );
          setEvents(publishedEvents);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des événements:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      loadEvents();
    }
  }, [selectedCity, status]);

  // Filtrer les villes selon la recherche
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) {
      return cities.slice(0, 10); // Limiter à 10 villes par défaut
    }
    const searchLower = citySearch.toLowerCase();
    return cities
      .filter((city) => city.toLowerCase().includes(searchLower))
      .slice(0, 10);
  }, [citySearch, cities]);

  // Événements du jour sélectionné, triés par heure de début
  const selectedDayEvents = useMemo(() => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    return events
      .filter((event) => {
        const eventDate = new Date(event.startDate);
        return eventDate >= dayStart && eventDate <= dayEnd;
      })
      .sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return dateA - dateB;
      });
  }, [events, selectedDate]);

  // Convertir les événements pour le calendrier
  const calendarEvents: CalendarEvent[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    eventType: e.eventType,
    startDate: e.startDate,
    endDate: e.endDate,
    location: e.location,
    city: e.city,
    participantCount: e.participantCount,
    maxParticipants: e.maxParticipants,
    status: e.status,
  }));

  const handleCitySelect = (city: string | null) => {
    setSelectedCity(city);
    setCitySearch(city || "");
    setShowCityDropdown(false);
  };

  const handleClearCity = () => {
    setSelectedCity(null);
    setCitySearch("");
    setShowCityDropdown(false);
  };

  const handleEventClick = (event: CalendarEvent) => {
    router.push(`/events/${event.id}`);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (
      status === "authenticated" &&
      session?.user?.accountType === "business"
    ) {
      router.push("/business/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading" || loading) {
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
            <Skeleton className="h-10 w-full max-w-md" />
            <EventCalendarSkeleton />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!session || session.user.accountType === "business") {
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
                  <BreadcrumbLink href="/feed">Portail Utilisateur</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Calendrier des événements</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Calendrier des événements</h1>
            <p className="text-muted-foreground">
              Découvrez tous les événements à venir, filtrés par ville.
            </p>
          </div>

          {/* Filtre par ville */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Filtrer par ville
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Rechercher une ville..."
                    value={citySearch}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    className="pl-10 pr-10"
                  />
                  {selectedCity && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                      onClick={handleClearCity}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {showCityDropdown && filteredCities.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
                    <div className="p-1">
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm"
                        onClick={() => handleCitySelect(null)}
                      >
                        Toutes les villes
                      </button>
                      {filteredCities.map((city) => (
                        <button
                          key={city}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm"
                          onClick={() => handleCitySelect(city)}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {selectedCity && (
                <div className="mt-3">
                  <Badge variant="secondary" className="text-sm">
                    <MapPin className="h-3 w-3 mr-1" />
                    {selectedCity}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendrier */}
          <EventCalendar
            events={calendarEvents}
            loading={loading}
            title="Calendrier"
            description="Sélectionnez un jour pour voir les événements"
            onDateSelect={setSelectedDate}
            onEventClick={handleEventClick}
          />

          {/* Liste des événements du jour sélectionné */}
          {selectedDayEvents.length > 0 && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  Événements du {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
                </h2>
                <p className="text-muted-foreground">
                  {selectedDayEvents.length} événement{selectedDayEvents.length > 1 ? 's' : ''} prévu{selectedDayEvents.length > 1 ? 's' : ''} ce jour
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {selectedDayEvents.map((event) => (
                  <div key={event.id} className="h-full">
                    <EventCard
                      event={{
                        ...event,
                        startDate: new Date(event.startDate),
                        endDate: event.endDate ? new Date(event.endDate) : null,
                      }}
                      showActions={false}
                      onView={() => router.push(`/events/${event.id}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDayEvents.length === 0 && !loading && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Aucun événement prévu le {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
