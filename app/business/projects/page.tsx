"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  FolderKanban,
  Archive,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCard } from "@/components/project-card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectStatus } from "@/lib/schema";
import { useToast } from "@/hooks/use-toast";
import { useScroll } from "@/hooks/use-scroll";

interface Project {
  id: number;
  title: string;
  shortDescription: string | null;
  fullDescription: string | null;
  bannerImage: string | null;
  carouselImages: string[] | null;
  objectives: string | null;
  achievements: string | null;
  impact: string | null;
  tags: string[] | null;
  customTags: string[] | null;
  contactEmail: string | null;
  contactPhone: string | null;
  externalLink: string | null;
  status: ProjectStatus;
  companyId: number;
  companyName: string | null;
  companyLogo: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const hasScrolled = useScroll();

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.accountType !== "business") {
      router.push("/login");
      return;
    }

    fetchProjects();
  }, [session, status, router]);

  const fetchProjects = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch("/api/projects?companyOnly=true");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleView = (project: Project) => {
    router.push(`/business/projects/${project.id}`);
  };

  const handleEdit = (project: Project) => {
    router.push(`/business/projects/${project.id}?edit=true`);
  };

  const handleDelete = async (projectId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Projet supprimé",
          description: "Le projet a été supprimé avec succès.",
        });
        fetchProjects(true);
      } else {
        throw new Error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du projet",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (project: Project) => {
    const newStatus = project.status === "archived" ? "active" : "archived";
    const action = newStatus === "archived" ? "archivé" : "réactivé";

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: `Projet ${action}`,
          description: `Le projet a été ${action} avec succès.`,
        });
        fetchProjects(true);
      } else {
        throw new Error("Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du projet",
        variant: "destructive",
      });
    }
  };

  // Filtrer les projets par statut
  const activeProjects = projects.filter((p) => p.status === "active");
  const archivedProjects = projects.filter((p) => p.status === "archived");

  const displayProjects =
    activeTab === "active" ? activeProjects : archivedProjects;

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
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
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
                  <BreadcrumbPage>Projets</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Projets</h1>
              <p className="text-muted-foreground">
                Présentez les projets de votre association
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => fetchProjects(true)}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Actualiser
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/business/projects/archived")}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archivés
              </Button>
              <Button onClick={() => router.push("/business/projects/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau projet
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total des projets
                </CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Projets actifs
                </CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activeProjects.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Archivés</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {archivedProjects.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs et liste */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active">
                Actifs ({activeProjects.length})
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archivés ({archivedProjects.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayProjects.length === 0 ? (
                  <div className="md:col-span-2 lg:col-span-3">
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                          <FolderKanban className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-4">
                          <h3 className="text-lg font-semibold">
                            {activeTab === "active"
                              ? "Aucun projet actif"
                              : "Aucun projet archivé"}
                          </h3>
                          <p className="text-muted-foreground max-w-md">
                            {activeTab === "active"
                              ? "Créez votre premier projet pour présenter les actions de votre association."
                              : "Les projets archivés apparaîtront ici."}
                          </p>
                          {activeTab === "active" && (
                            <Button
                              onClick={() =>
                                router.push("/business/projects/create")
                              }
                              size="lg"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Créer mon premier projet
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  displayProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onArchive={handleArchive}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
