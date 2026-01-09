"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  Upload,
  Camera,
} from "lucide-react";

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
          setCompanyData(data);
          setFormData(data);
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
            areaId: "1",
            values: ["1", "2", "3"],
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
          areaId: "1",
          values: ["1", "2", "3"],
        };
        setCompanyData(defaultData);
        setFormData(defaultData);
      } finally {
        setIsLoading(false);
      }
    };

    if (
      status === "authenticated" &&
      session?.user?.accountType === "business"
    ) {
      loadCompanyData();
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
    areaId: string;
    values: string[];
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
    areaId: "",
    values: [],
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
          <Card>
            <CardHeader className="pb-0">
              {/* Background Image */}
              <div className="relative h-32 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
                {formData.background && (
                  <img
                    src={formData.background}
                    alt="Background"
                    className="w-full h-full object-cover"
                  />
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <UploadButton
                      type="banner"
                      onUpload={(url, publicId) => {
                        setFormData({ ...formData, background: url });
                      }}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Changer la banni&egrave;re
                    </UploadButton>
                  </div>
                )}
              </div>

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
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Site web</p>
                        <p className="text-sm text-muted-foreground">
                          {companyData.website}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Fondée en</p>
                        <p className="text-sm text-muted-foreground">
                          {companyData.founded}
                        </p>
                      </div>
                    </div>
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
