"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useScroll } from "@/hooks/use-scroll";
import {
  MapPin,
  Globe,
  Calendar, Building2,
  ExternalLink
} from "lucide-react";
import { EVENT_TYPES } from "@/lib/schema";
import { cn } from "@/lib/utils";

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

interface UserProfile {
  id: number;
  name: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  banner: string | null;
  backgroundType: "image" | "gradient" | null;
  backgroundGradient: {
    color1: string;
    color2: string;
    css: string;
  } | null;
  isOnline: boolean;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  linkedinUrl: string | null;
  createdAt: Date;
  stats?: {
    followingUsers: number;
    followingCompanies: number;
  };
  events: Array<{
    id: number;
    title: string;
    description: string | null;
    eventType: string;
    startDate: Date;
    endDate: Date | null;
    location: string | null;
    city: string | null;
    images: string[] | null;
    coverImage: string | null;
    status: string;
    companyId: number;
    companyName: string | null;
    companyLogo: string | null;
    participantStatus: string;
  }>;
  followedCompanies: Array<{
    id: number;
    name: string;
    description: string | null;
    logo: string | null;
    city: string | null;
    createdAt: Date;
  }>;
}

export default function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [showFollowingUsers, setShowFollowingUsers] = useState(false);
  const [showFollowingCompanies, setShowFollowingCompanies] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<any[]>([]);
  const [followingCompanies, setFollowingCompanies] = useState<any[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const hasScrolled = useScroll();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/user/${resolvedParams.userId}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        } else if (response.status === 404) {
          router.push("/");
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [resolvedParams.userId, router]);

  // Vérifier si l'user connecté suit ce profil
  useEffect(() => {
    const checkFollowing = async () => {
      if (
        !session?.user ||
        session.user.accountType !== "user" ||
        !profile ||
        parseInt(session.user.id) === profile.id
      ) {
        return;
      }

      try {
        const response = await fetch(`/api/user/${profile.id}/follow`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing || false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du follow:", error);
      }
    };

    checkFollowing();
  }, [session, profile]);

  const handleFollowToggle = async () => {
    if (!session?.user || session.user.accountType !== "user" || !profile) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour suivre un utilisateur.",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(session.user.id) === profile.id) {
      return;
    }

    setIsTogglingFollow(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const response = await fetch(`/api/user/${profile.id}/follow`, {
        method,
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        toast({
          title: isFollowing ? "Désabonnement réussi" : "Abonnement réussi",
          description: isFollowing
            ? "Vous ne suivez plus cet utilisateur."
            : "Vous suivez maintenant cet utilisateur.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Une erreur s'est produite.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors du toggle follow:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'opération.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const loadFollowingUsers = async () => {
    if (!profile) return;
    setLoadingFollowing(true);
    try {
      const response = await fetch(`/api/user/${profile.id}/following/users`);
      if (response.ok) {
        const data = await response.json();
        setFollowingUsers(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des users suivis:", error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const loadFollowingCompanies = async () => {
    if (!profile) return;
    setLoadingFollowing(true);
    try {
      const response = await fetch(
        `/api/user/${profile.id}/following/companies`
      );
      if (response.ok) {
        const data = await response.json();
        setFollowingCompanies(data);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des associations suivies:",
        error
      );
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleUnfollowUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/user/${userId}/follow`, {
        method: "DELETE",
      });
      if (response.ok) {
        setFollowingUsers(followingUsers.filter((u) => u.id !== userId));
        toast({
          title: "Désabonnement réussi",
          description: "Vous ne suivez plus cet utilisateur.",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'unfollow:", error);
    }
  };

  const handleUnfollowCompany = async (companyId: number) => {
    try {
      const response = await fetch(`/api/companies/follow/${companyId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setFollowingCompanies(
          followingCompanies.filter((c) => c.id !== companyId)
        );
        toast({
          title: "Désabonnement réussi",
          description: "Vous ne suivez plus cette association.",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'unfollow:", error);
    }
  };

  if (loading) {
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
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!profile) {
    return null;
  }

  const bannerStyle =
    profile.backgroundType === "gradient" && profile.backgroundGradient
      ? { background: profile.backgroundGradient.css }
      : profile.banner
      ? {}
      : { background: "linear-gradient(to bottom, #f3f4f6, #ffffff)" };

  return (
    <SidebarProvider>
      <DynamicSidebar />
      <SidebarInset>
        <header
          className={cn(
            "sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
            hasScrolled ? "border-b" : ""
          )}
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
                  <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {profile.name || "Profil utilisateur"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          {/* Banner */}
          <div
            className="relative h-48 w-full"
            style={bannerStyle}
          >
            {profile.backgroundType === "image" && profile.banner && (
              <Image
                src={profile.banner}
                alt="Banner"
                fill
                className="object-cover"
              />
            )}
          </div>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            {/* Profil Header */}
            <div className="flex flex-col md:flex-row gap-4 -mt-16">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={profile.image || ""} />
                <AvatarFallback>
                  {profile.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pt-20 md:pt-24">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">
                      {profile.name || "Utilisateur"}
                    </h1>
                    {profile.isOnline && (
                      <Badge
                        variant="outline"
                        className="mt-2 bg-green-500/10 text-green-600 border-green-500/20"
                      >
                        En ligne
                      </Badge>
                    )}
                    {profile.stats && (
                      <div className="flex gap-4 mt-4">
                        <button
                          onClick={() => {
                            setShowFollowingUsers(true);
                            loadFollowingUsers();
                          }}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <span className="font-semibold">
                            {profile.stats.followingUsers}
                          </span>{" "}
                          personnes suivies
                        </button>
                        <button
                          onClick={() => {
                            setShowFollowingCompanies(true);
                            loadFollowingCompanies();
                          }}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <span className="font-semibold">
                            {profile.stats.followingCompanies}
                          </span>{" "}
                          associations suivies
                        </button>
                      </div>
                    )}
                  </div>
                  {session?.user &&
                    session.user.accountType === "user" &&
                    parseInt(session.user.id) !== profile.id && (
                      <Button
                        onClick={handleFollowToggle}
                        disabled={isTogglingFollow}
                        variant={isFollowing ? "outline" : "default"}
                      >
                        {isTogglingFollow
                          ? "Chargement..."
                          : isFollowing
                          ? "Ne plus suivre"
                          : "Suivre"}
                      </Button>
                    )}
                </div>
                {profile.bio && (
                  <p className="mt-4 text-muted-foreground">{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-4">
                  {profile.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      Site web
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {(profile.instagramUrl ||
                    profile.tiktokUrl ||
                    profile.linkedinUrl) && (
                    <div className="flex items-center gap-3">
                      {profile.instagramUrl && (
                        <a
                          href={profile.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <InstagramIcon className="h-5 w-5" />
                        </a>
                      )}
                      {profile.tiktokUrl && (
                        <a
                          href={profile.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <TikTokIcon className="h-5 w-5" />
                        </a>
                      )}
                      {profile.linkedinUrl && (
                        <a
                          href={profile.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <LinkedInIcon className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Contenu principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                {/* Événements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Événements ({profile.events.length})
                    </CardTitle>
                    <CardDescription>
                      Événements auxquels cet utilisateur participe
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {profile.events.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun événement pour le moment
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {profile.events.map((event) => {
                          const startDate = new Date(event.startDate);
                          const isPast = startDate < new Date();
                          return (
                            <Link
                              key={event.id}
                              href={`/events/${event.id}`}
                              className="block"
                            >
                              <Card className="hover:bg-accent transition-colors cursor-pointer">
                                <CardContent className="p-4">
                                  <div className="flex gap-4">
                                    {event.coverImage && (
                                      <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden">
                                        <Image
                                          src={event.coverImage}
                                          alt={event.title}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold truncate">
                                          {event.title}
                                        </h3>
                                        <Badge
                                          variant="outline"
                                          className="flex-shrink-0"
                                        >
                                          {EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] || event.eventType}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-4 w-4" />
                                          {format(startDate, "d MMM yyyy", {
                                            locale: fr,
                                          })}
                                        </div>
                                        {event.city && (
                                          <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {event.city}
                                          </div>
                                        )}
                                      </div>
                                      {event.companyName && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <Avatar className="h-5 w-5">
                                            <AvatarImage
                                              src={event.companyLogo || ""}
                                            />
                                            <AvatarFallback>
                                              {event.companyName.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm text-muted-foreground">
                                            {event.companyName}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Colonne latérale */}
              <div className="space-y-6">
                {/* Associations suivies */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Associations ({profile.followedCompanies.length})
                    </CardTitle>
                    <CardDescription>
                      Associations suivies par cet utilisateur
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {profile.followedCompanies.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4 text-sm">
                        Aucune association suivie
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {profile.followedCompanies.map((company) => (
                          <Link
                            key={company.id}
                            href={`/company/${company.name}`}
                            className="block"
                          >
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={company.logo || ""} />
                                <AvatarFallback>
                                  {company.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {company.name}
                                </p>
                                {company.city && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {company.city}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Membre depuis
                      </span>
                      <span>
                        {format(new Date(profile.createdAt), "MMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Dialog pour les users suivis */}
      <Dialog open={showFollowingUsers} onOpenChange={setShowFollowingUsers}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personnes suivies</DialogTitle>
            <DialogDescription>
              Liste des personnes suivies par {profile.name || "cet utilisateur"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {loadingFollowing ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : followingUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune personne suivie
              </div>
            ) : (
              <div className="space-y-3">
                {followingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Link
                      href={`/user/${user.id}`}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback>
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.name || "Utilisateur"}
                        </p>
                        {user.bio && (
                          <p className="text-sm text-muted-foreground truncate">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                    {session?.user &&
                      parseInt(session.user.id) === profile.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnfollowUser(user.id)}
                        >
                          Ne plus suivre
                        </Button>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour les associations suivies */}
      <Dialog
        open={showFollowingCompanies}
        onOpenChange={setShowFollowingCompanies}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Associations suivies</DialogTitle>
            <DialogDescription>
              Liste des associations suivies par {profile.name || "cet utilisateur"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {loadingFollowing ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : followingCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune association suivie
              </div>
            ) : (
              <div className="space-y-3">
                {followingCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Link
                      href={`/company/${company.name}`}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={company.logo || ""} />
                        <AvatarFallback>
                          {company.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{company.name}</p>
                        {company.city && (
                          <p className="text-sm text-muted-foreground truncate">
                            {company.city}
                          </p>
                        )}
                      </div>
                    </Link>
                    {session?.user &&
                      parseInt(session.user.id) === profile.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnfollowCompany(company.id)}
                        >
                          Ne plus suivre
                        </Button>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
