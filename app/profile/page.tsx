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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useScroll } from "@/hooks/use-scroll";
import { UploadButton } from "@/components/ui/upload-button";
import {
  User,
  Mail,
  MapPin,
  Globe,
  Edit,
  Save,
  X,
  Trash2,
  Upload,
  Camera,
} from "lucide-react";

// Système de dégradés automatiques pour les bannières
const bannerGradients = [
  "bg-gradient-to-r from-blue-500 to-purple-600",
  "bg-gradient-to-r from-green-400 to-blue-500",
  "bg-gradient-to-r from-pink-500 to-red-500",
  "bg-gradient-to-r from-yellow-400 to-orange-500",
  "bg-gradient-to-r from-indigo-500 to-purple-600",
  "bg-gradient-to-r from-teal-400 to-blue-500",
  "bg-gradient-to-r from-rose-500 to-pink-500",
  "bg-gradient-to-r from-cyan-500 to-blue-600",
  "bg-gradient-to-r from-emerald-500 to-teal-500",
  "bg-gradient-to-r from-violet-500 to-purple-600",
];

// Fonction pour obtenir un dégradé basé sur l'ID utilisateur
function getUserGradient(userId: string | number | undefined): string {
  if (!userId) return bannerGradients[0]; // Dégradé par défaut si pas d'ID

  const idString = String(userId);
  const hash = idString
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return bannerGradients[hash % bannerGradients.length];
}

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasScrolled = useScroll();

  // Données du profil utilisateur
  const [userData, setUserData] = useState({
    id: "",
    name: "",
    email: "",
    image: "",
    bio: "",
    location: "",
    website: "",
    banner: "",
    createdAt: new Date(),
  });

  const [formData, setFormData] = useState(userData);

  useEffect(() => {
    setFormData(userData);
  }, [userData]);

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

  // Charger les données du profil utilisateur
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setFormData(data);
        } else {
          console.error("Erreur lors du chargement des données");
          // Utiliser des données par défaut si l'API échoue
          const defaultData = {
            id: session?.user?.id || "",
            name: session?.user?.name || "Utilisateur",
            email: session?.user?.email || "",
            image: session?.user?.image || "",
            bio: "Décrivez-vous en quelques mots...",
            location: "",
            website: "",
            banner: "",
            createdAt: new Date(),
          };
          setUserData(defaultData);
          setFormData(defaultData);
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
        // Utiliser des données par défaut si l'API échoue
        const defaultData = {
          id: session?.user?.id || "",
          name: session?.user?.name || "Utilisateur",
          email: session?.user?.email || "",
          image: session?.user?.image || "",
          bio: "Décrivez-vous en quelques mots...",
          location: "",
          website: "",
          banner: "",
          createdAt: new Date(),
        };
        setUserData(defaultData);
        setFormData(defaultData);
      } finally {
        setIsLoading(false);
      }
    };

    if (
      status === "authenticated" &&
      session?.user?.accountType !== "business"
    ) {
      loadUserData();
    }
  }, [status, session]);

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
          <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
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

  if (!session || session.user.accountType === "business") {
    return null;
  }

  const handleSave = async () => {
    try {
      const response = await fetch("/api/user/profile", {
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
      setUserData(formData);
      setIsEditing(false);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées.",
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
    setFormData(userData);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé définitivement.",
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

  // Obtenir le dégradé pour cet utilisateur
  const userGradient = getUserGradient(userData.id);

  return (
    <SidebarProvider>
      <DynamicSidebar />
      <SidebarInset>
        <header
          className={`sticky top-0 z-10 flex h-16 shrink-0 items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ${
            hasScrolled ? "border-b" : ""
          }`}
        >
          <div className="flex justify-between items-center w-full px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/feed">
                      Portail Utilisateur
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Profil</BreadcrumbPage>
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Mon profil</h1>
            <p className="text-muted-foreground">
              Gérez vos informations personnelles et vos préférences.
            </p>
          </div>

          {/* User Background and Header */}
          <Card>
            <CardHeader className="pb-0">
              {/* Background Image */}
              <div
                className={`relative h-32 rounded-lg overflow-hidden ${
                  !formData.banner ? userGradient : ""
                } mb-4`}
              >
                {formData.banner && (
                  <img
                    src={formData.banner}
                    alt="Background"
                    className="w-full h-full object-cover"
                  />
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <UploadButton
                      type="banner"
                      onUpload={(url, publicId) => {
                        setFormData({ ...formData, banner: url });
                      }}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Changer la banni&egrave;re
                    </UploadButton>
                  </div>
                )}
              </div>

              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-4 -mt-12 relative z-10">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-background">
                    <AvatarImage src={formData.image} alt={formData.name} />
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
                          setFormData({ ...formData, image: url });
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
                          Nom complet
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
                        <Label htmlFor="bio" className="mb-2">
                          Description
                        </Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bio: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="Parlez-nous de vous..."
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-xl">{userData.name}</CardTitle>
                      <div className="mt-1">
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {showFullBio ||
                          !userData.bio ||
                          userData.bio.length <= 150
                            ? userData.bio ||
                              "Décrivez-vous en quelques mots..."
                            : `${userData.bio.substring(0, 150)}...`}
                        </p>
                        {userData.bio && userData.bio.length > 150 && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-xs mt-1"
                            onClick={() => setShowFullBio(!showFullBio)}
                          >
                            {showFullBio ? "Voir moins" : "Voir plus"}
                          </Button>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          Membre depuis{" "}
                          {new Date(userData.createdAt).toLocaleDateString(
                            "fr-FR",
                            {
                              year: "numeric",
                              month: "long",
                            }
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* User Information Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
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
                        disabled
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        L&apos;email ne peut pas être modifié
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="location" className="mb-2">
                        Localisation
                      </Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="Ville, Pays"
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
                          {userData.email}
                        </p>
                      </div>
                    </div>
                    {userData.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Localisation</p>
                          <p className="text-sm text-muted-foreground">
                            {userData.location}
                          </p>
                        </div>
                      </div>
                    )}
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
                ) : (
                  userData.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Site web</p>
                        <p className="text-sm text-muted-foreground">
                          {userData.website}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
              <CardDescription>
                Aperçu de votre activité sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">
                    Événements suivis
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">Publications</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">
                    Entreprises suivies
                  </p>
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
                    Supprimer le compte
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Êtes-vous sûr ?</DialogTitle>
                    <DialogDescription>
                      Cette action est irr&eacute;versible. Toutes vos
                      donn&eacute;es, publications et participations aux
                      &eacute;v&eacute;nements seront supprim&eacute;es
                      d&eacute;finitivement.
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
