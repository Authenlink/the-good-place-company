"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
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
import { BackgroundSelector } from "@/components/background-selector";
import type { Gradient } from "@/lib/gradient-generator";
import {
  User,
  Mail,
  Lock,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Edit,
  MapPin,
  Globe,
  Upload,
  X,
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

export default function UserAccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    backgroundType: null as "image" | "gradient" | null,
    backgroundGradient: null as Gradient | null,
    isOnline: false,
    instagramUrl: "",
    tiktokUrl: "",
    linkedinUrl: "",
    createdAt: new Date(),
  });

  const [formData, setFormData] = useState(userData);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setFormData(userData);
  }, [userData]);

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

  // Charger les données du profil utilisateur
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          // S'assurer que bio n'est jamais null
          const normalizedData = {
            ...data,
            bio: data.bio || "",
            location: data.location || "",
            website: data.website || "",
            banner: data.banner || "",
            isOnline: data.isOnline || false,
            instagramUrl: data.instagramUrl || "",
            tiktokUrl: data.tiktokUrl || "",
            linkedinUrl: data.linkedinUrl || "",
          };
          setUserData(normalizedData);
          setFormData(normalizedData);
        } else {
          console.error("Erreur lors du chargement des données");
          // Utiliser des données par défaut si l'API échoue
          const defaultData = {
            id: session?.user?.id || "",
            name: session?.user?.name || "Utilisateur",
            email: session?.user?.email || "",
            image: session?.user?.image || "",
            bio: "",
            location: "",
            website: "",
            banner: "",
            backgroundType: null as "image" | "gradient" | null,
            backgroundGradient: null as Gradient | null,
            isOnline: false,
            instagramUrl: "",
            tiktokUrl: "",
            linkedinUrl: "",
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
          backgroundType: null as "image" | "gradient" | null,
          backgroundGradient: null as Gradient | null,
          isOnline: false,
          instagramUrl: "",
          tiktokUrl: "",
          linkedinUrl: "",
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
      session?.user?.accountType === "business"
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

  if (!session || session.user.accountType !== "business") {
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

  const handlePasswordChange = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont requis",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Erreur",
        description:
          "Le nouveau mot de passe doit contenir au moins 8 caractères",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Erreur lors de la modification du mot de passe",
        );
      }

      // Réinitialiser le formulaire
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été modifié avec succès.",
      });
    } catch (error) {
      console.error("Erreur modification mot de passe:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Une erreur s'est produite lors de la modification du mot de passe.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Erreur lors de la suppression du compte",
        );
      }

      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès.",
      });

      // Déconnexion et redirection
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Erreur suppression compte:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Une erreur s'est produite lors de la suppression du compte.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
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
                    <BreadcrumbPage>Compte utilisateur</BreadcrumbPage>
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
            <h1 className="text-2xl font-bold">Compte utilisateur</h1>
            <p className="text-muted-foreground">
              Gérez vos informations personnelles et les paramètres de votre
              compte.
            </p>
          </div>

          {/* User Background and Header */}
          <Card className="overflow-hidden p-0">
            {/* Background Image or Gradient */}
            <div className="relative h-32 w-full">
              {formData.backgroundType === "gradient" &&
              formData.backgroundGradient ? (
                <div
                  className="w-full h-full"
                  style={{
                    background: formData.backgroundGradient.css,
                  }}
                />
              ) : formData.banner ? (
                <Image
                  src={formData.banner}
                  alt="Background"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
              )}
            </div>

            <CardHeader className="pb-0">
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
                        onUpload={(url) => {
                          setFormData({ ...formData, image: url });
                        }}
                        className="h-8 w-8 rounded-full p-0"
                      >
                        <User className="h-4 w-4" />
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
                          value={formData.bio || ""}
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
                      {userData.bio && (
                        <div className="mt-1">
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {showFullBio || userData.bio.length <= 150
                              ? userData.bio
                              : `${userData.bio.substring(0, 150)}...`}
                          </p>
                          {userData.bio.length > 150 && (
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
                      )}
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          Membre depuis{" "}
                          {new Date(userData.createdAt).toLocaleDateString(
                            "fr-FR",
                            {
                              year: "numeric",
                              month: "long",
                            },
                          )}
                        </p>
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
                <CardTitle>Background</CardTitle>
                <CardDescription>
                  Choisissez une image ou un gradient pour votre bannière
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <UploadButton
                    type="banner"
                    onUpload={(url) => {
                      setFormData({
                        ...formData,
                        banner: url,
                        backgroundType: "image",
                      });
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter une image
                  </UploadButton>
                  {formData.banner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          banner: "",
                          backgroundType:
                            formData.backgroundType === "image"
                              ? null
                              : formData.backgroundType,
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer l&apos;image
                    </Button>
                  )}
                </div>
                <BackgroundSelector
                  images={formData.banner ? [formData.banner] : []}
                  backgroundType={formData.backgroundType || null}
                  backgroundImageIndex={formData.banner ? 0 : null}
                  backgroundGradient={formData.backgroundGradient || null}
                  onBackgroundTypeChange={(type) => {
                    setFormData({ ...formData, backgroundType: type });
                  }}
                  onBackgroundImageIndexChange={() => {
                    // For users, we only have one image (banner field)
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
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="isOnline">Statut en ligne</Label>
                        <p className="text-xs text-muted-foreground">
                          Afficher que vous êtes en ligne
                        </p>
                      </div>
                      <Switch
                        id="isOnline"
                        checked={formData.isOnline}
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
                      <Label htmlFor="instagramUrl" className="mb-2">
                        Instagram
                      </Label>
                      <Input
                        id="instagramUrl"
                        type="url"
                        value={formData.instagramUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            instagramUrl: e.target.value,
                          })
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
                        value={formData.tiktokUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tiktokUrl: e.target.value,
                          })
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
                        value={formData.linkedinUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            linkedinUrl: e.target.value,
                          })
                        }
                        placeholder="https://linkedin.com/in/votreprofil"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {userData.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Site web</p>
                          <a
                            href={userData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary"
                          >
                            {userData.website}
                          </a>
                        </div>
                      </div>
                    )}
                    {(userData.instagramUrl ||
                      userData.tiktokUrl ||
                      userData.linkedinUrl) && (
                      <div className="flex items-center gap-4 pt-2">
                        {userData.instagramUrl && (
                          <a
                            href={userData.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-pink-600 transition-colors"
                            title="Instagram"
                          >
                            <InstagramIcon className="h-5 w-5" />
                          </a>
                        )}
                        {userData.tiktokUrl && (
                          <a
                            href={userData.tiktokUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-black transition-colors"
                            title="TikTok"
                          >
                            <TikTokIcon className="h-5 w-5" />
                          </a>
                        )}
                        {userData.linkedinUrl && (
                          <a
                            href={userData.linkedinUrl}
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

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              {/* Boutons principaux - responsive */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-2 order-2 sm:order-1">
                <Button onClick={handleSave} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>

              {/* Bouton supprimer - en bas sur mobile */}
              <div className="order-3 sm:order-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting} className="w-full sm:w-auto">
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
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                      >
                        {isDeleting
                          ? "Suppression..."
                          : "Supprimer définitivement"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {/* Password Change Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Modifier le mot de passe
              </CardTitle>
              <CardDescription>
                Changez votre mot de passe pour sécuriser votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative mt-2">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative mt-2">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 8 caractères
                </p>
              </div>
              <div>
                <Label htmlFor="confirmPassword">
                  Confirmer le nouveau mot de passe
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handlePasswordChange}
                disabled={isChangingPassword}
              >
                <Save className="h-4 w-4 mr-2" />
                {isChangingPassword
                  ? "Modification..."
                  : "Modifier le mot de passe"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
