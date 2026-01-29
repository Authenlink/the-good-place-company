"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  RefreshCw,
  Users,
  UserX,
  Edit,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import { useScroll } from "@/hooks/use-scroll";
import { useToast } from "@/hooks/use-toast";
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
import { MEMBER_TYPES, type MemberType } from "@/lib/schema";

interface Member {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
  memberType: MemberType;
  joinedAt: Date;
}

export default function MembersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemberType, setSelectedMemberType] = useState<string>("all");
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const hasScrolled = useScroll();

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.accountType !== "business") {
      router.push("/login");
      return;
    }

    fetchMembers();
  }, [session, status, router]);

  useEffect(() => {
    // Filtrer les membres en fonction de la recherche et du type
    let filtered = members;

    // Filtre par type
    if (selectedMemberType !== "all") {
      filtered = filtered.filter(
        (member) => member.memberType === selectedMemberType
      );
    }

    // Filtre par recherche
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (member) =>
          member.name?.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query)
      );
    }

    setFilteredMembers(filtered);
  }, [searchQuery, selectedMemberType, members]);

  const fetchMembers = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch("/api/company/members");
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
        setFilteredMembers(data.members || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des membres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemoveMember = async (member: Member) => {
    setRemovingMemberId(member.id);
    try {
      const response = await fetch(`/api/company/members/${member.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMembers(members.filter((m) => m.id !== member.id));
        setMemberToRemove(null);
        toast({
          title: "Membre retiré",
          description: `${member.name || member.email} a été retiré de votre association.`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Erreur lors de la suppression",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleUpdateMemberType = async (
    memberId: number,
    newMemberType: MemberType
  ) => {
    setEditingMemberId(memberId);
    try {
      const response = await fetch(`/api/company/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberType: newMemberType }),
      });

      if (response.ok) {
        setMembers(
          members.map((m) =>
            m.id === memberId ? { ...m, memberType: newMemberType } : m
          )
        );
        toast({
          title: "Type de membre mis à jour",
          description: "Le type de membre a été modifié avec succès.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Erreur lors de la mise à jour",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setEditingMemberId(null);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

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
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-12 w-full" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const volunteerCount = members.filter(
    (m) => m.memberType === "volunteer"
  ).length;
  const permanentMemberCount = members.filter(
    (m) => m.memberType === "permanent_member"
  ).length;

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
                  <BreadcrumbPage>Membres</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Membres de l'association</h1>
              <p className="text-muted-foreground">
                Gérez les membres qui participent à votre association
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => fetchMembers(true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total des membres
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bénévoles</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{volunteerCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Membres permanents
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{permanentMemberCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle>Rechercher et filtrer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedMemberType}
                  onValueChange={setSelectedMemberType}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="volunteer">
                      {MEMBER_TYPES.volunteer}
                    </SelectItem>
                    <SelectItem value="permanent_member">
                      {MEMBER_TYPES.permanent_member}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des membres */}
          {filteredMembers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">
                    {searchQuery.trim() === "" && selectedMemberType === "all"
                      ? "Aucun membre"
                      : "Aucun résultat"}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchQuery.trim() === "" && selectedMemberType === "all"
                      ? "Les membres de votre association apparaîtront ici."
                      : "Aucun membre ne correspond à vos critères de recherche."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => (
                <Card
                  key={member.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        href={`/user/${member.id}`}
                        className="flex items-center gap-4 flex-1 min-w-0"
                      >
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage
                            src={member.image || undefined}
                            alt={member.name || member.email}
                          />
                          <AvatarFallback>
                            {getInitials(member.name, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate hover:underline">
                            {member.name || "Utilisateur"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {member.email}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {MEMBER_TYPES[member.memberType]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(member.joinedAt), "MMM yyyy", {
                                locale: fr,
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateMemberType(
                                member.id,
                                member.memberType === "volunteer"
                                  ? "permanent_member"
                                  : "volunteer"
                              )
                            }
                            disabled={editingMemberId === member.id}
                          >
                            {editingMemberId === member.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Edit className="h-4 w-4 mr-2" />
                            )}
                            Changer en{" "}
                            {member.memberType === "volunteer"
                              ? MEMBER_TYPES.permanent_member
                              : MEMBER_TYPES.volunteer}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setMemberToRemove(member)}
                            className="text-destructive focus:text-destructive"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Retirer de l'association
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer un membre</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer{" "}
              <strong>
                {memberToRemove?.name || memberToRemove?.email}
              </strong>{" "}
              de votre association ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMemberToRemove(null)}
            >
              Annuler
            </Button>
            <Button
              onClick={() =>
                memberToRemove && handleRemoveMember(memberToRemove)
              }
              disabled={removingMemberId === memberToRemove?.id}
              variant="destructive"
            >
              {removingMemberId === memberToRemove?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Retirer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
