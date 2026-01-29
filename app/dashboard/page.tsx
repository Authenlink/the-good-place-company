"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import { CitySelectionDialog } from "@/components/city-selection-dialog";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  EventCalendar,
  EventCalendarSkeleton,
  type CalendarEvent,
} from "@/components/event-calendar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useScroll } from "@/hooks/use-scroll";
import { EventType } from "@/lib/schema";

interface StatsData {
  upcomingEvents: {
    confirmed: number;
    waitlisted: number;
    total: number;
  };
  chartData: {
    monthly: Array<{
      date: string;
      eventCount: number;
    }>;
  };
}

const chartConfig = {
  eventCount: {
    label: "Événements",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface UserEvent {
  id: number;
  title: string;
  eventType: EventType;
  startDate: string;
  endDate: string | null;
  location: string | null;
  city: string | null;
  participantCount: number;
  maxParticipants: number | null;
  status: string;
  participantStatus: "confirmed" | "waitlisted";
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showCityDialog, setShowCityDialog] = useState(false);
  const [checkingCity, setCheckingCity] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const hasScrolled = useScroll();

  // Check if user has a referenced city
  useEffect(() => {
    const checkUserCity = async () => {
      if (status === "authenticated" && session?.user?.accountType !== "business") {
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const data = await response.json();
            // Show dialog if user doesn't have a referenced city
            if (!data.referencedCity) {
              setShowCityDialog(true);
            }
          }
        } catch (error) {
          console.error("Error checking user city:", error);
        } finally {
          setCheckingCity(false);
        }
      } else {
        setCheckingCity(false);
      }
    };

    if (status === "authenticated") {
      checkUserCity();
    } else if (status !== "loading") {
      setCheckingCity(false);
    }
  }, [status, session]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    // Redirect business users to business dashboard
    if (
      status === "authenticated" &&
      session?.user?.accountType === "business"
    ) {
      router.push("/business/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user?.accountType !== "business"
    ) {
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsResponse = await fetch("/api/user/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch user events
      const eventsResponse = await fetch("/api/user/events");
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelected = (_city: string) => {
    setShowCityDialog(false);
    // Refresh the page to update any city-dependent content
    router.refresh();
  };

  const handleEventClick = (event: CalendarEvent) => {
    router.push(`/events/${event.id}`);
  };

  // Convertir les événements pour le calendrier et dédupliquer par ID
  const calendarEvents: CalendarEvent[] = React.useMemo(() => {
    const now = new Date();
    const eventsMap = new Map<number, CalendarEvent>();
    
    events
      .filter((e) => new Date(e.startDate) >= now)
      .forEach((e) => {
        // Utiliser un Map pour éviter les doublons par ID
        if (!eventsMap.has(e.id)) {
          eventsMap.set(e.id, {
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
            participantStatus: e.participantStatus, // confirmed ou waitlisted
          });
        }
      });
    
    return Array.from(eventsMap.values());
  }, [events]);

  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "MMM yyyy", { locale: fr });
  };

  if (status === "loading" || checkingCity || loading) {
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
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <Skeleton className="aspect-video rounded-xl" />
              <Skeleton className="aspect-video rounded-xl" />
              <Skeleton className="aspect-video rounded-xl" />
            </div>
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!session) {
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
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="mb-2">
            <h1 className="text-2xl font-bold">
              Bienvenue, {session.user.name} !
            </h1>
            <p className="text-muted-foreground">
              Voici un aperçu de vos événements et activités.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Événements confirmés
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    stats?.upcomingEvents.confirmed || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Inscriptions confirmées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Liste d&apos;attente
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    stats?.upcomingEvents.waitlisted || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  En attente de confirmation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total à venir
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    stats?.upcomingEvents.total || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Événements à venir
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Calendrier de vos événements</CardTitle>
              <CardDescription>
                Vos événements à venir auxquels vous êtes inscrit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <EventCalendarSkeleton />
              ) : (
                <EventCalendar
                  events={calendarEvents}
                  loading={loading}
                  title=""
                  description=""
                  onEventClick={handleEventClick}
                />
              )}
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="pt-6">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
              <div className="grid flex-1 gap-1">
                <CardTitle>Vos participations par mois</CardTitle>
                <CardDescription>
                  Nombre d&apos;événements auxquels vous avez participé
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : !stats?.chartData.monthly || stats.chartData.monthly.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune donnée disponible pour le moment
                  </p>
                </div>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[280px] md:h-[350px] lg:h-[400px] w-full"
                >
                  <AreaChart data={stats.chartData.monthly}>
                    <defs>
                      <linearGradient
                        id="fillEventCount"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-eventCount)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-eventCount)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={formatChartDate}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value: string | number | Date) => {
                            const date = new Date(value);
                            return format(date, "MMMM yyyy", { locale: fr });
                          }}
                          indicator="dot"
                        />
                      }
                    />
                    <Area
                      dataKey="eventCount"
                      type="natural"
                      fill="url(#fillEventCount)"
                      stroke="var(--color-eventCount)"
                      stackId="a"
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
      {/* City Selection Dialog - only show for regular users without a referenced city */}
      {session?.user?.accountType !== "business" && (
        <CitySelectionDialog
          open={showCityDialog}
          onCitySelected={handleCitySelected}
        />
      )}
    </SidebarProvider>
  );
}
