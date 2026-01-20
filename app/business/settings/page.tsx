"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
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
import { Building2, User } from "lucide-react";

export default function BusinessSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  if (status === "loading") {
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
              {[...Array(2)].map((_, i) => (
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
                  <BreadcrumbItem>
                    <BreadcrumbPage>Paramètres</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Paramètres</h1>
            <p className="text-muted-foreground">
              Gérez les paramètres de votre entreprise et de votre compte utilisateur.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/business/settings/profile">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                <CardHeader className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Profil entreprise
                  </CardTitle>
                  <CardDescription>
                    Gérez les informations générales de votre entreprise, votre logo, description et paramètres de visibilité.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configurez le profil public de votre entreprise, ajoutez des informations de contact, des réseaux sociaux et personnalisez l&apos;apparence.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/business/settings/user-account">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                <CardHeader className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Compte utilisateur
                  </CardTitle>
                  <CardDescription>
                    Gérez vos informations personnelles, la sécurité de votre compte et vos préférences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Modifiez votre mot de passe, vos informations de contact et configurez les paramètres de sécurité de votre compte.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}