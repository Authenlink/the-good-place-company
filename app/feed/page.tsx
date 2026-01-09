"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useScroll } from "@/hooks/use-scroll";
import { PostCard } from "@/components/post-card";
import { EventCard } from "@/components/event-card";

interface Post {
  id: number;
  content: string;
  images: string[];
  createdAt: string;
  displayName?: string;
  displayImage?: string;
  isCompanyPost?: boolean;
  companyName?: string;
  companyLogo?: string;
  type?: string;
  date?: Date;
}

interface Event {
  id: number;
  title: string;
  description: string | null;
  eventType: string;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  address: string | null;
  city: string | null;
  images: string[] | null;
  maxParticipants: number | null;
  isPaid: boolean;
  price: string | null;
  currency: string;
  status: string;
  companyName: string | null;
  companyLogo: string | null;
  participantCount: number;
  waitlistCount: number;
  createdAt: string;
  type?: string;
  date?: Date;
}

interface FeedPageProps {
  searchParams: Promise<{
    city?: string;
  }>;
}

export default function FeedPage({ searchParams }: FeedPageProps) {
  const { city: selectedCity } = use(searchParams);
  const hasScrolled = useScroll();

  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les posts
        const postsResponse = await fetch("/api/posts");
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setPosts(postsData);
        }

        // Récupérer les événements (uniquement les publiés)
        const eventsResponse = await fetch("/api/events?filter=all");
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          // Filtrer seulement les événements publiés
          const publishedEvents = eventsData.filter(
            (event: { status?: string }) => event.status === "published"
          );
          setEvents(publishedEvents);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Combiner et trier par date (plus récent en premier)
  const combinedContent: (Post | Event)[] = [
    ...posts.map(
      (post) =>
        ({ ...post, type: "post", date: new Date(post.createdAt) } as Post)
    ),
    ...events.map(
      (event) =>
        ({ ...event, type: "event", date: new Date(event.createdAt) } as Event)
    ),
  ].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

  if (loading) {
    return (
      <SidebarProvider>
        <DynamicSidebar />
        <SidebarInset>
          <header
            className={`sticky top-0 z-10 flex h-16 shrink-0 items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12`}
          >
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <div className="text-sm text-muted-foreground">Chargement...</div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement du feed...</p>
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
          className={`sticky top-0 z-10 flex h-16 shrink-0 items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ${
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
                <BreadcrumbItem>
                  <BreadcrumbPage>Actualités</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-0 pt-0">
          {selectedCity ? (
            <div className="flex flex-1 items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Projets de {selectedCity}
                </h2>
                <p className="text-muted-foreground">
                  Filtrage par ville en cours d&apos;implémentation...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Les projets de {selectedCity} apparaîtront ici bientôt.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Contenu du feed */}
              <div className="w-full max-w-5xl mx-auto px-4 pb-8">
                {combinedContent.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Aucun contenu disponible
                    </p>
                  </div>
                ) : (
                  combinedContent.map((item) => (
                    <div key={`${item.type}-${item.id}`}>
                      {item.type === "post" ? (
                        <PostCard post={item as Post} />
                      ) : (
                        <EventCard event={item as Event} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
