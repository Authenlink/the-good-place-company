"use client";

import { useState, useEffect } from "react";
import { useScroll } from "@/hooks/use-scroll";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, UserPlus, Calendar, TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

interface StatsData {
  kpis: {
    totalFollowers: number;
    newFollowersThisMonth: number;
    totalParticipants: number;
    participantsThisMonth: number;
  };
  chartData: {
    daily: Array<{
      date: string;
      newFollowers: number;
      newParticipants: number;
    }>;
    monthly: Array<{
      date: string;
      newFollowers: number;
      newParticipants: number;
    }>;
  };
}

const chartConfig = {
  newFollowers: {
    label: "Nouveaux abonnés",
    color: "var(--chart-1)",
  },
  newParticipants: {
    label: "Nouveaux participants",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;


export default function FollowersInsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const hasScrolled = useScroll();
  const [timeRange, setTimeRange] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.accountType !== "business") {
      router.push("/login");
      return;
    }

    fetchStats();
  }, [session, status, router]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/followers/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === "daily") {
      return format(date, "d MMM", { locale: fr });
    } else {
      return format(date, "MMM yyyy", { locale: fr });
    }
  };

  const filteredData = stats
    ? timeRange === "daily"
      ? stats.chartData.daily
      : stats.chartData.monthly
    : [];

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!stats) {
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
                  <BreadcrumbLink href="/business/followers">
                    Abonnés
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Statistiques</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Statistiques des abonnés
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Analyse de la progression de votre communauté
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/business/followers")}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Retour aux abonnés</span>
              <span className="sm:hidden">Retour</span>
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total des abonnés
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.kpis.totalFollowers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Utilisateurs abonnés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Nouveaux abonnés
                </CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.kpis.newFollowersThisMonth}
                </div>
                <p className="text-xs text-muted-foreground">Ce mois-ci</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total participants
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.kpis.totalParticipants}
                </div>
                <p className="text-xs text-muted-foreground">
                  Participants uniques
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Participants récents
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.kpis.participantsThisMonth}
                </div>
                <p className="text-xs text-muted-foreground">
                  Inscriptions ce mois
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="pt-6">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
              <div className="grid flex-1 gap-1">
                <CardTitle>
                  {timeRange === "daily"
                    ? "Nouveaux abonnés et participants par jour"
                    : "Nouveaux abonnés et participants par mois"}
                </CardTitle>
                <CardDescription>
                  {timeRange === "daily"
                    ? "Évolution quotidienne sur les 4 derniers mois"
                    : "Évolution mensuelle"}
                </CardDescription>
              </div>
              <Select
                value={timeRange}
                onValueChange={(value) =>
                  setTimeRange(value as "daily" | "monthly")
                }
              >
                <SelectTrigger
                  className="hidden w-[180px] rounded-lg sm:ml-auto sm:flex"
                  aria-label="Sélectionner une période"
                >
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="daily" className="rounded-lg">
                    Vue journalière
                  </SelectItem>
                  <SelectItem value="monthly" className="rounded-lg">
                    Vue mensuelle
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              {filteredData.length === 0 ? (
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
                  <AreaChart data={filteredData}>
                    <defs>
                      <linearGradient
                        id="fillNewParticipants"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-newParticipants)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-newParticipants)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="fillNewFollowers"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-newFollowers)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-newFollowers)"
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
                          labelFormatter={(value: any) => {
                            const date = new Date(value);
                            if (timeRange === "daily") {
                              return format(date, "d MMM yyyy", { locale: fr });
                            } else {
                              return format(date, "MMMM yyyy", { locale: fr });
                            }
                          }}
                          indicator="dot"
                        />
                      }
                    />
                    <Area
                      dataKey="newParticipants"
                      type="natural"
                      fill="url(#fillNewParticipants)"
                      stroke="var(--color-newParticipants)"
                      stackId="a"
                    />
                    <Area
                      dataKey="newFollowers"
                      type="natural"
                      fill="url(#fillNewFollowers)"
                      stroke="var(--color-newFollowers)"
                      stackId="a"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
