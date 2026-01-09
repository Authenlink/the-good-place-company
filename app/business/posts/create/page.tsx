"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxImages = 4;
    const currentCount = images.length;
    const availableSlots = maxImages - currentCount;

    if (files.length > availableSlots) {
      toast({
        title: "Trop d'images",
        description: `Vous pouvez ajouter maximum ${availableSlots} image(s) supplémentaire(s).`,
        variant: "destructive",
      });
      return;
    }

    setUploadingImages(true);

    try {
      const newImages: string[] = [];

      for (let i = 0; i < files.length && i < availableSlots; i++) {
        const file = files[i];

        // Validation
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Type de fichier invalide",
            description: "Utilisez uniquement JPG, PNG ou WebP.",
            variant: "destructive",
          });
          continue;
        }

        if (file.size > maxSize) {
          toast({
            title: "Fichier trop volumineux",
            description: "La taille maximale est de 5MB par image.",
            variant: "destructive",
          });
          continue;
        }

        // Upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "post");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erreur lors de l'upload");
        }

        newImages.push(result.url);
      }

      setImages((prev) => [...prev, ...newImages]);

      if (newImages.length > 0) {
        toast({
          title: "Images ajoutées",
          description: `${newImages.length} image(s) ajoutée(s) avec succès.`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur d'upload",
        description: "Une erreur s'est produite lors de l'upload des images.",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Contenu requis",
        description: "Veuillez écrire quelque chose dans votre post.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          images,
        }),
      });

      if (response.ok) {
        toast({
          title: "Post créé",
          description: "Votre post a été publié avec succès.",
        });
        router.push("/business/posts");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création du post");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la création du post.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <SidebarProvider>
        <DynamicSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </header>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!session || session.user?.accountType !== "business") {
    router.push("/login");
    return null;
  }

  return (
    <SidebarProvider>
      <DynamicSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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
                  <BreadcrumbLink href="/business/posts">Posts</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Créer un post</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Nouveau post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contenu du post */}
              <div className="space-y-2">
                <Label htmlFor="content">Contenu *</Label>
                <Textarea
                  id="content"
                  placeholder="Quoi de neuf ? Partagez vos pensées, vos actualités..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={2000}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {content.length}/2000 caractères
                </div>
              </div>

              {/* Upload d'images */}
              <div className="space-y-4">
                <Label>Images (optionnel)</Label>

                {/* Aperçu des images */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border">
                          <Image
                            src={image}
                            alt={`Image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bouton d'upload */}
                {images.length < 4 && (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <div className="text-center space-y-4">
                      <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                      <div>
                        <Label
                          htmlFor="image-upload"
                          className="cursor-pointer"
                        >
                          <span className="text-sm font-medium">
                            Ajouter des images
                          </span>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImages}
                          />
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG ou WebP • Max 5MB par image •{" "}
                          {4 - images.length} restantes
                        </p>
                      </div>
                      {uploadingImages && (
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Upload en cours...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim() || isSubmitting || uploadingImages}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publication...
                    </>
                  ) : (
                    "Publier"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
