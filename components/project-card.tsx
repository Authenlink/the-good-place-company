"use client";

import Image from "next/image";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PROJECT_TAGS, ProjectStatus, PROJECT_STATUSES } from "@/lib/schema";
import { cn } from "@/lib/utils";

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

interface ProjectCardProps {
  project: Project;
  onView?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: number) => void;
  onArchive?: (project: Project) => void;
  showActions?: boolean;
}

// Couleurs des tags par défaut pour les tags personnalisés
const customTagColors = [
  "bg-slate-500/10 text-slate-600 border-slate-500/20",
  "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  "bg-stone-500/10 text-stone-600 border-stone-500/20",
];

// Couleurs par statut
const statusColors: Record<ProjectStatus, string> = {
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  archived: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

// Fonction pour obtenir la couleur d'un tag
function getTagColor(tagKey: string): string {
  const predefinedTag = PROJECT_TAGS[tagKey as keyof typeof PROJECT_TAGS];
  if (predefinedTag) {
    // Convertir la couleur Tailwind en classes de badge
    const colorMap: Record<string, string> = {
      "bg-red-500": "bg-red-500/10 text-red-600 border-red-500/20",
      "bg-green-500": "bg-green-500/10 text-green-600 border-green-500/20",
      "bg-blue-500": "bg-blue-500/10 text-blue-600 border-blue-500/20",
      "bg-pink-500": "bg-pink-500/10 text-pink-600 border-pink-500/20",
      "bg-purple-500": "bg-purple-500/10 text-purple-600 border-purple-500/20",
      "bg-orange-500": "bg-orange-500/10 text-orange-600 border-orange-500/20",
      "bg-teal-500": "bg-teal-500/10 text-teal-600 border-teal-500/20",
      "bg-amber-500": "bg-amber-500/10 text-amber-600 border-amber-500/20",
      "bg-lime-500": "bg-lime-500/10 text-lime-600 border-lime-500/20",
      "bg-cyan-500": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    };
    return colorMap[predefinedTag.color] || customTagColors[0];
  }
  // Pour les tags personnalisés, utiliser une couleur basée sur le hash
  const hash = tagKey
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return customTagColors[hash % customTagColors.length];
}

// Fonction pour obtenir le nom d'un tag
function getTagName(tagKey: string): string {
  const predefinedTag = PROJECT_TAGS[tagKey as keyof typeof PROJECT_TAGS];
  return predefinedTag ? predefinedTag.name : tagKey;
}

export function ProjectCard({
  project,
  onView,
  onEdit,
  onDelete,
  onArchive,
  showActions = true,
}: ProjectCardProps) {
  const isArchived = project.status === "archived";
  const allTags = [...(project.tags || []), ...(project.customTags || [])];
  const displayTags = allTags.slice(0, 3);
  const remainingTags = allTags.length - 3;

  return (
    <Card
      className={cn(
        "w-full overflow-hidden transition-all hover:shadow-md cursor-pointer",
        isArchived && "opacity-60"
      )}
      onClick={() => onView?.(project)}
    >
      {/* Image de banner */}
      {project.bannerImage && (
        <div className="relative h-40 w-full">
          <Image
            src={project.bannerImage}
            alt={project.title}
            fill
            className="object-cover"
          />
          {/* Badge de statut si archivé */}
          {isArchived && (
            <div className="absolute top-2 right-2">
              <Badge
                variant="outline"
                className={cn(
                  "backdrop-blur-sm bg-background/80",
                  statusColors[project.status]
                )}
              >
                {PROJECT_STATUSES[project.status]}
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardHeader className={cn("pb-2", !project.bannerImage && "pt-4")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Badge de statut si pas d'image */}
            {!project.bannerImage && isArchived && (
              <div className="mb-2">
                <Badge
                  variant="outline"
                  className={statusColors[project.status]}
                >
                  {PROJECT_STATUSES[project.status]}
                </Badge>
              </div>
            )}
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              {project.title}
            </h3>
          </div>

          {showActions && (onView || onEdit || onDelete || onArchive) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(project);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir les détails
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(project);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {onArchive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(project);
                      }}
                    >
                      {isArchived ? (
                        <>
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Réactiver
                        </>
                      ) : (
                        <>
                          <Archive className="h-4 w-4 mr-2" />
                          Archiver
                        </>
                      )}
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(project.id);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Description courte */}
        {project.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.shortDescription}
          </p>
        )}

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn("text-xs", getTagColor(tag))}
              >
                {getTagName(tag)}
              </Badge>
            ))}
            {remainingTags > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingTags}
              </Badge>
            )}
          </div>
        )}

        {/* Nombre d'images dans le carrousel */}
        {project.carouselImages && project.carouselImages.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {project.carouselImages.length} photo
            {project.carouselImages.length > 1 ? "s" : ""} dans le projet
          </p>
        )}

        {/* Organisation */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={project.companyLogo || ""}
              alt={project.companyName || ""}
            />
            <AvatarFallback className="text-xs">
              {project.companyName?.charAt(0).toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground truncate">
            {project.companyName || "Association"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
