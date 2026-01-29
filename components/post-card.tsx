"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CommentSection } from "@/components/comment-section";
import { useToast } from "@/hooks/use-toast";

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
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const { toast } = useToast();

  // Charger l'état initial des likes et le nombre de commentaires
  useEffect(() => {
    fetchLikes();
    fetchCommentCount();
  }, [post.id]);

  const fetchLikes = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/likes`);
      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.count);
        setIsLiked(data.isLiked);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des likes:", error);
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleLike = async () => {
    const previousIsLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      if (previousIsLiked) {
        // Supprimer le like
        const response = await fetch(`/api/posts/${post.id}/likes`, {
          method: "DELETE",
        });
        if (!response.ok) {
          // Revert on error
          setIsLiked(previousIsLiked);
          setLikeCount(previousCount);
        }
      } else {
        // Ajouter le like
        const response = await fetch(`/api/posts/${post.id}/likes`, {
          method: "POST",
        });
        if (!response.ok) {
          // Revert on error
          setIsLiked(previousIsLiked);
          setLikeCount(previousCount);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du like:", error);
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousCount);
    }
  };

  const fetchCommentCount = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        // Compter tous les commentaires (principaux + réponses)
        const totalCount = data.reduce((acc: number, comment: any) => {
          return acc + 1 + (comment.replies?.length || 0);
        }, 0);
        setCommentCount(totalCount);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du nombre de commentaires:", error);
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/feed?post=${post.id}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Lien copié",
        description: "Le lien du post a été copié dans le presse-papier.",
      });
    } catch (error) {
      console.error("Erreur lors de la copie du lien:", error);
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive",
      });
    }
  };

  const displayName = post.displayName || post.companyName || "Utilisateur";
  const displayImage = post.displayImage || post.companyLogo;

  return (
    <Card className="w-full mb-6 overflow-hidden">
      <CardContent className="p-0">
        {/* Header avec avatar et nom */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 sm:pb-4">
          <div className="flex items-center space-x-3">
            {post.isCompanyPost && post.companyName ? (
              <Link href={`/associations/${encodeURIComponent(post.companyName)}`}>
                <Avatar className="h-9 w-9 sm:h-8 sm:w-8 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={displayImage} alt={displayName} />
                  <AvatarFallback>
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Avatar className="h-9 w-9 sm:h-8 sm:w-8">
                <AvatarImage src={displayImage} alt={displayName} />
                <AvatarFallback>
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              {post.isCompanyPost && post.companyName ? (
                <Link 
                  href={`/associations/${encodeURIComponent(post.companyName)}`}
                  className="text-sm sm:text-sm font-semibold text-foreground hover:underline block"
                >
                  {displayName}
                </Link>
              ) : (
                <p className="text-sm sm:text-sm font-semibold text-foreground">
                  {displayName}
                </p>
              )}
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
        <div className="px-4 sm:px-5 py-3 sm:py-3 border-t">
          <div className="flex items-center space-x-5 sm:space-x-4">
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={loadingLikes}
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
              {likeCount > 0 && (
                <span className="text-xs sm:text-xs text-muted-foreground">
                  {likeCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowComments(!showComments);
                  if (!showComments) {
                    fetchCommentCount();
                  }
                }}
                className="p-0 h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-5 w-5 sm:h-5 sm:w-5" />
              </Button>
              {commentCount > 0 && (
                <span className="text-xs sm:text-xs text-muted-foreground">
                  {commentCount}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-0 h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-5 w-5 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        {/* Section commentaires */}
        {showComments && (
          <div className="px-4 sm:px-6 pb-4 border-t bg-muted">
            <div className="py-4 sm:py-3">
              <CommentSection postId={post.id} onCommentAdded={fetchCommentCount} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
