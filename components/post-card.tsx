"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface PostCardProps {
  post: {
    id: number;
    content: string;
    images: string[];
    createdAt: string;
    displayName?: string;
    displayImage?: string;
    isCompanyPost?: boolean;
    companyName?: string;
    companyLogo?: string;
  };
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const displayName = post.displayName || post.companyName || "Utilisateur";
  const displayImage = post.displayImage || post.companyLogo;

  return (
    <Card className="w-full mb-6 overflow-hidden">
      <CardContent className="p-0">
        {/* Header avec avatar et nom */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 sm:pb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9 sm:h-8 sm:w-8">
              <AvatarImage src={displayImage} alt={displayName} />
              <AvatarFallback>
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm sm:text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="text-xs sm:text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Contenu textuel */}
        <div className="px-4 sm:px-5 pb-3 sm:pb-3">
          <p className="text-sm sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="relative">
            {post.images.length === 1 ? (
              <div className="relative aspect-[4/5] sm:aspect-square">
                <Image
                  src={post.images[0]}
                  alt="Post image"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {post.images.slice(0, 4).map((image, index) => (
                  <div
                    key={index}
                    className={`relative ${
                      post.images.length === 3 && index === 0
                        ? "col-span-2 aspect-[2/1]"
                        : "aspect-square"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Post image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                    {index === 3 && post.images.length > 4 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{post.images.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3 border-t">
          <div className="flex items-center space-x-5 sm:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`p-0 h-9 w-9 sm:h-8 sm:w-8 ${
                isLiked ? "text-red-500" : "text-muted-foreground"
              } hover:text-red-500`}
            >
              <Heart
                className={`h-5 w-5 sm:h-5 sm:w-5 ${
                  isLiked ? "fill-current" : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="p-0 h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-5 w-5 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-5 w-5 sm:h-5 sm:w-5" />
            </Button>
          </div>
          <div className="text-xs sm:text-xs text-muted-foreground">
            {likeCount > 0 && `${likeCount} like${likeCount > 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Section commentaires (placeholder) */}
        {showComments && (
          <div className="px-4 sm:px-6 pb-4 border-t bg-muted">
            <div className="py-4 sm:py-3">
              <p className="text-sm sm:text-xs text-muted-foreground text-center">
                Commentaires en cours de développement...
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
