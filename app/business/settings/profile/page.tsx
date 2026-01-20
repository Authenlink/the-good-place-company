"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UploadButton } from "@/components/ui/upload-button";
import { BackgroundSelector } from "@/components/background-selector";
import type { Gradient } from "@/lib/gradient-generator";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Edit,
  Save,
  X,
  Trash2,
  Upload
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

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

export default function CompanyProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    // Redirect regular users to user dashboard
    if (
      status === "authenticated" &&
      session?.user?.accountType !== "business"
    ) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Charger les données de l'entreprise
  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const response = await fetch("/api/company");
        if (response.ok) {
          const data = await response.json();
          const normalizedData = {
            ...data,
            isOnline: data.isOnline || false,
            instagramUrl: data.instagramUrl || "",
            tiktokUrl: data.tiktokUrl || "",
            linkedinUrl: data.linkedinUrl || "",
          };
          setCompanyData(normalizedData);
          setFormData(normalizedData);
        } else {
          console.error("Erreur lors du chargement des données");
          // Utiliser des données par défaut si l'API échoue
          const defaultData = {
            name: "The Good Place Company",
            description:
              "Une entreprise dédiée à créer des expériences exceptionnelles pour nos clients et notre communauté.",
            email: session?.user?.email || "contact@thegoodplace.com",
            phone: "+33 1 23 45 67 89",
            address: "123 Rue de l'Innovation, 75001 Paris, France",
            website: "https://thegoodplace.com",
            founded: "2020",
            industry: "Technologie",
            size: "11-50 employés",
            logo: session?.user?.image || "",
            background: "",
            backgroundType: null as "image" | "gradient" | null,
            backgroundGradient: null as Gradient | null,
            areaId: "1",
            values: ["1", "2", "3"],
            isOnline: false,
            instagramUrl: "",
            tiktokUrl: "",
            linkedinUrl: "",
          };
          setCompanyData(defaultData);
          setFormData(defaultData);
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
        // Utiliser des données par défaut si l'API échoue
        const defaultData = {
          name: "The Good Place Company",
          description:
            "Une entreprise dédiée à créer des expériences exceptionnelles pour nos clients et notre communauté.",
          email: session?.user?.email || "contact@thegoodplace.com",
          phone: "+33 1 23 45 67 89",
          address: "123 Rue de l'Innovation, 75001 Paris, France",
          website: "https://thegoodplace.com",
          founded: "2020",
          industry: "Technologie",
          size: "11-50 employés",
          logo: session?.user?.image || "",
          background: "",
          backgroundType: null as "image" | "gradient" | null,
          backgroundGradient: null as Gradient | null,
          areaId: "1",
          values: ["1", "2", "3"],
        };
        setCompanyData(defaultData);
        setFormData(defaultData);
      } finally {
        setIsLoading(false);
      }
    };

    const loadCompanyStats = async () => {
      try {
        const response = await fetch("/api/company/stats");
        if (response.ok) {
          const stats = await response.json();
          setCompanyStats(stats);
        } else {
          console.error("Erreur lors du chargement des statistiques");
          // Garder les valeurs par défaut (0)
        }
      } catch (error) {
        console.error("Erreur réseau lors du chargement des statistiques:", error);
        // Garder les valeurs par défaut (0)
      } finally {
        setIsLoading(false);
      }
    };

    if (
      status === "authenticated" &&
      session?.user?.accountType === "business"
    ) {
      loadCompanyData();
      loadCompanyStats();
    }
  }, [status, session]);

  // Mock data for areas and values
  const areas = [
    { id: "1", name: "Technologie" },
    { id: "2", name: "Finance" },
    { id: "3", name: "Santé" },
    { id: "4", name: "Éducation" },
    { id: "5", name: "Commerce" },
    { id: "6", name: "Industrie" },
    { id: "7", name: "Services" },
    { id: "8", name: "Tourisme" },
  ];

  const availableValues = [
    { id: "1", name: "Innovation" },
    { id: "2", name: "Durabilité" },
    { id: "3", name: "Excellence" },
    { id: "4", name: "Intégrité" },
    { id: "5", name: "Collaboration" },
    { id: "6", name: "Responsabilité sociale" },
    { id: "7", name: "Transparence" },
    { id: "8", name: "Qualité" },
  ];

  // Company data loaded from API
  const [companyData, setCompanyData] = useState<{
    name: string;
    description: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    founded: string;
    industry: string;
    size: string;
    logo: string;
    background: string;
    backgroundType?: "image" | "gradient" | null;
    backgroundGradient?: Gradient | null;
    areaId: string;
    values: string[];
    isOnline?: boolean;
    instagramUrl?: string;
    tiktokUrl?: string;
    linkedinUrl?: string;
  }>({
    name: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    founded: "",
    industry: "",
    size: "",
    logo: "",
    background: "",
    backgroundType: null,
    backgroundGradient: null,
    areaId: "",
    values: [],
    isOnline: false,
    instagramUrl: "",
    tiktokUrl: "",
    linkedinUrl: "",
  });

  // Statistiques de l'entreprise
  const [companyStats, setCompanyStats] = useState<{
    activeEvents: number;
    followers: number;
  }>({
    activeEvents: 0,
    followers: 0,
  });

  const [formData, setFormData] = useState(companyData);

  useEffect(() => {
    setFormData(companyData);
  }, [companyData]);

  if (status === "loading" || isLoading) {
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
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!session || session.user.accountType !== "business") {
    return null;
  }

  const handleSave = async () => {
    try {
      const response = await fetch("/api/company/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la sauvegarde");
      }

      // Mettre à jour l'état local avec les données sauvegardées
      setCompanyData(formData);
      setIsEditing(false);
      toast({
        title: "Profil mis à jour",
        description:
          "Les informations de votre entreprise ont été enregistrées.",
      });
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Une erreur s'est produite lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData(companyData);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: "Entreprise supprimée",
        description: "Votre entreprise a été supprimée définitivement.",
      });
      router.push("/login");
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la suppression.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedArea = areas.find((area) => area.id === formData.areaId);
  const selectedValues = availableValues.filter((value) =>
    formData.values.includes(value.id)
  );

  return (
    <SidebarProvider>
      <DynamicSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex justify-between items-center w-full px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/business/dashboard">
                      Portail Entreprise
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/business/settings">
                      Paramètres
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Profil entreprise</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Profil entreprise</h1>
            <p className="text-muted-foreground">
              Gérez les informations de votre entreprise et ses paramètres.
            </p>
          </div>

          {/* Company Background and Header */}
          <Card className="overflow-hidden p-0">
            {/* Background Image or Gradient */}
            <div className="relative h-32 w-full">
                {formData.backgroundType === "gradient" && formData.backgroundGradient ? (
                  <div
                    className="w-full h-full"
                    style={{
                      background: formData.backgroundGradient.css,
                    }}
                  />
                ) : formData.background ? (
                  <Image
                    src={formData.background}
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
                    <AvatarImage src={formData.logo} alt={formData.name} />
                    <AvatarFallback className="text-lg">
                      {formData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Indicateur de présence en ligne */}
                  <div
                    className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-4 border-background ${
                      formData.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                    title={formData.isOnline ? "En ligne" : "Hors ligne"}
                  />
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2">
                      <UploadButton
                        type="avatar"
                        onUpload={(url, publicId) => {
                          setFormData({ ...formData, logo: url });
                        }}
                        className="h-8 w-8 rounded-full p-0"
                      >
                        <Upload className="h-4 w-4" />
                      </UploadButton>
                    </div>
                  )}
                </div>
                <div className="flex-1 pt-8">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="mb-2">
                          Nom de l&apos;entreprise
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="description" className="mb-2">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="area" className="mb-2">
                            Secteur d&apos;activité
                          </Label>
                          <Select
                            value={formData.areaId}
                            onValueChange={(value) =>
                              setFormData({ ...formData, areaId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir un secteur" />
                            </SelectTrigger>
                            <SelectContent>
                              {areas.map((area) => (
                                <SelectItem key={area.id} value={area.id}>
                                  {area.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="size" className="mb-2">
                            Taille
                          </Label>
                          <Select
                            value={formData.size}
                            onValueChange={(value) =>
                              setFormData({ ...formData, size: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir la taille" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-10 employés">
                                1-10 employés
                              </SelectItem>
                              <SelectItem value="11-50 employés">
                                11-50 employés
                              </SelectItem>
                              <SelectItem value="51-200 employés">
                                51-200 employés
                              </SelectItem>
                              <SelectItem value="201-500 employés">
                                201-500 employés
                              </SelectItem>
                              <SelectItem value="500+ employés">
                                500+ employés
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2">Valeurs (maximum 3)</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {availableValues.map((value) => {
                            const isSelected = formData.values.includes(
                              value.id
                            );
                            return (
                              <Button
                                key={value.id}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormData({
                                      ...formData,
                                      values: formData.values.filter(
                                        (id) => id !== value.id
                                      ),
                                    });
                                  } else if (formData.values.length < 3) {
                                    setFormData({
                                      ...formData,
                                      values: [...formData.values, value.id],
                                    });
                                  }
                                }}
                                disabled={
                                  !isSelected && formData.values.length >= 3
                                }
                              >
                                {value.name}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-xl">
                        {companyData.name}
                      </CardTitle>
                      <div className="mt-1">
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {showFullDescription ||
                          companyData.description.length <= 150
                            ? companyData.description
                            : `${companyData.description.substring(0, 150)}...`}
                        </p>
                        {companyData.description.length > 150 && (
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
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedArea && (
                          <Badge variant="secondary">{selectedArea.name}</Badge>
                        )}
                        <Badge variant="outline">{companyData.size}</Badge>
                        {selectedValues.map((value) => (
                          <Badge key={value.id} variant="outline">
                            {value.name}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Background Selector - Only show when editing */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Personnalisation du background</CardTitle>
                <CardDescription>
                  Choisissez une image ou un gradient pour votre bannière
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <UploadButton
                    type="banner"
                    onUpload={(url, publicId) => {
                      setFormData({
                        ...formData,
                        background: url,
                        backgroundType: "image",
                      });
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter une image
                  </UploadButton>
                  {formData.background && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          background: "",
                          backgroundType: formData.backgroundType === "image" ? null : formData.backgroundType,
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer l&apos;image
                    </Button>
                  )}
                </div>
                <BackgroundSelector
                  images={formData.background ? [formData.background] : []}
                  backgroundType={formData.backgroundType || null}
                  backgroundImageIndex={formData.background ? 0 : null}
                  backgroundGradient={formData.backgroundGradient || null}
                  onBackgroundTypeChange={(type) => {
                    setFormData({ ...formData, backgroundType: type });
                  }}
                  onBackgroundImageIndexChange={(index) => {
                    // For companies, we only have one image (background field)
                    // So index doesn't really matter, but we keep it for consistency
                    setFormData({ ...formData, backgroundType: "image" });
                  }}
                  onBackgroundGradientChange={(gradient) => {
                    setFormData({
                      ...formData,
                      backgroundGradient: gradient,
                      backgroundType: "gradient",
                    });
                  }}
                  showPreview={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Company Information Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="email" className="mb-2">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="mb-2">
                        Téléphone
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="address" className="mb-2">
                        Adresse
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {companyData.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Téléphone</p>
                        <p className="text-sm text-muted-foreground">
                          {companyData.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Adresse</p>
                        <p className="text-sm text-muted-foreground">
                          {companyData.address}
                        </p>
                      </div>
                    </div>
                  </>
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
                {isEditing ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="isOnline">Statut en ligne</Label>
                        <p className="text-xs text-muted-foreground">
                          Afficher que l&apos;entreprise est en ligne
                        </p>
                      </div>
                      <Switch
                        id="isOnline"
                        checked={formData.isOnline || false}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isOnline: checked })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="website" className="mb-2">
                        Site web
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                        placeholder="https://votresite.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="founded" className="mb-2">
                        Fondée en
                      </Label>
                      <Input
                        id="founded"
                        value={formData.founded}
                        onChange={(e) =>
                          setFormData({ ...formData, founded: e.target.value })
                        }
                        placeholder="2020"
                      />
                    </div>
                    <div>
                      <Label htmlFor="instagramUrl" className="mb-2">
                        Instagram
                      </Label>
                      <Input
                        id="instagramUrl"
                        type="url"
                        value={formData.instagramUrl || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, instagramUrl: e.target.value })
                        }
                        placeholder="https://instagram.com/votrecompte"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tiktokUrl" className="mb-2">
                        TikTok
                      </Label>
                      <Input
                        id="tiktokUrl"
                        type="url"
                        value={formData.tiktokUrl || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, tiktokUrl: e.target.value })
                        }
                        placeholder="https://tiktok.com/@votrecompte"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedinUrl" className="mb-2">
                        LinkedIn
                      </Label>
                      <Input
                        id="linkedinUrl"
                        type="url"
                        value={formData.linkedinUrl || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, linkedinUrl: e.target.value })
                        }
                        placeholder="https://linkedin.com/company/votreentreprise"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {companyData.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Site web</p>
                          <a
                            href={companyData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary"
                          >
                            {companyData.website}
                          </a>
                        </div>
                      </div>
                    )}
                    {companyData.founded && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Fondée en</p>
                          <p className="text-sm text-muted-foreground">
                            {companyData.founded}
                          </p>
                        </div>
                      </div>
                    )}
                    {(companyData.instagramUrl || companyData.tiktokUrl || companyData.linkedinUrl) && (
                      <div className="flex items-center gap-4 pt-2">
                        {companyData.instagramUrl && (
                          <a
                            href={companyData.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-pink-600 transition-colors"
                            title="Instagram"
                          >
                            <InstagramIcon className="h-5 w-5" />
                          </a>
                        )}
                        {companyData.tiktokUrl && (
                          <a
                            href={companyData.tiktokUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-black transition-colors"
                            title="TikTok"
                          >
                            <TikTokIcon className="h-5 w-5" />
                          </a>
                        )}
                        {companyData.linkedinUrl && (
                          <a
                            href={companyData.linkedinUrl}
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Company Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques de l&apos;entreprise</CardTitle>
              <CardDescription>
                Aperçu des métriques clés de votre entreprise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-center">
                  <div className="text-2xl font-bold">{companyStats.activeEvents}</div>
                  <p className="text-sm text-muted-foreground">
                    Événements actifs
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{companyStats.followers}</div>
                  <p className="text-sm text-muted-foreground">Abonnés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-between items-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer l&apos;entreprise
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Êtes-vous sûr ?</DialogTitle>
                    <DialogDescription>
                      Cette action est irr&eacute;versible. Toutes les
                      donn&eacute;es de votre entreprise,
                      &eacute;v&eacute;nements, projets et abonn&eacute;s seront
                      supprim&eacute;s d&eacute;finitivement.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>
                      Annuler
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting
                        ? "Suppression..."
                        : "Supprimer définitivement"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
