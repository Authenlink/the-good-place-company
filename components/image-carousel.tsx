"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "wide";
  showThumbnails?: boolean;
  allowFullscreen?: boolean;
}

export function ImageCarousel({
  images,
  alt = "Image",
  className,
  aspectRatio = "video",
  showThumbnails = true,
  allowFullscreen = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const aspectRatioClass = {
    video: "aspect-video",
    square: "aspect-square",
    wide: "aspect-[21/9]",
  }[aspectRatio];

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (!images || images.length === 0) {
    return (
      <div
        className={cn(
          "bg-muted rounded-lg flex items-center justify-center",
          aspectRatioClass,
          className
        )}
      >
        <span className="text-muted-foreground">Aucune image</span>
      </div>
    );
  }

  // Une seule image, pas besoin de carrousel
  if (images.length === 1) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden", className)}>
        <div className={cn("relative w-full", aspectRatioClass)}>
          <Image
            src={images[0]}
            alt={alt}
            fill
            className="object-cover"
            priority
          />
        </div>
        {allowFullscreen && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70"
            onClick={() => setIsFullscreen(true)}
          >
            <Expand className="h-4 w-4 text-white" />
          </Button>
        )}

        {/* Modal plein écran */}
        {isFullscreen && (
          <FullscreenModal
            images={images}
            currentIndex={0}
            alt={alt}
            onClose={() => setIsFullscreen(false)}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Image principale */}
      <div className="relative rounded-lg overflow-hidden group">
        <div className={cn("relative w-full", aspectRatioClass)}>
          <Image
            src={images[currentIndex]}
            alt={`${alt} ${currentIndex + 1}`}
            fill
            className="object-cover transition-opacity duration-300"
            priority={currentIndex === 0}
          />
        </div>

        {/* Boutons de navigation */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={goToNext}
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </Button>

        {/* Indicateurs */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-4"
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>

        {/* Compteur */}
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Bouton plein écran */}
        {allowFullscreen && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsFullscreen(true)}
          >
            <Expand className="h-4 w-4 text-white" />
          </Button>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                index === currentIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-muted-foreground/50"
              )}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal plein écran */}
      {isFullscreen && (
        <FullscreenModal
          images={images}
          currentIndex={currentIndex}
          alt={alt}
          onClose={() => setIsFullscreen(false)}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onIndexChange={goToIndex}
        />
      )}
    </div>
  );
}

// Composant modal plein écran
interface FullscreenModalProps {
  images: string[];
  currentIndex: number;
  alt: string;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onIndexChange?: (index: number) => void;
}

function FullscreenModal({
  images,
  currentIndex,
  alt,
  onClose,
  onPrevious,
  onNext,
  onIndexChange,
}: FullscreenModalProps) {
  // Gérer les touches clavier
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrevious();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrevious, onNext]
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Bouton fermer */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 h-10 w-10 text-white hover:bg-white/20 z-10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Image */}
      <div
        className="relative w-full h-full max-w-7xl max-h-[90vh] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          {/* Thumbnails en bas */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onIndexChange?.(index);
                }}
                className={cn(
                  "relative w-12 h-12 rounded overflow-hidden border-2 transition-all",
                  index === currentIndex
                    ? "border-white"
                    : "border-transparent opacity-50 hover:opacity-100"
                )}
              >
                <Image
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {/* Compteur */}
          <div className="absolute top-4 left-4 text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
