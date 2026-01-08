"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Edit,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentSection } from "./comment-section";

interface Post {
  id: number;
  content: string;
  images: string[];
  createdAt: string;
  userId: number | null;
  companyId: number | null;
  userName: string | null;
  userImage: string | null;
  companyName: string | null;
  companyLogo: string | null;
  displayName?: string;
  displayImage?: string;
  isCompanyPost?: boolean;
}

interface PostCardProps {
  post: Post;
  onComment?: (postId: number, content: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: number) => void;
}

export function PostCard({ post, onComment, onEdit, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Utiliser les propriétés calculées par l'API
  const displayName =
    post.displayName ||
    post.companyName ||
    post.userName ||
    "Utilisateur inconnu";
  const displayImage = post.displayImage || post.companyLogo || post.userImage;

  const handleComment = async () => {
    if (!commentText.trim() || !onComment) return;

    setIsSubmittingComment(true);
    try {
      await onComment(post.id, commentText.trim());
      setCommentText("");
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleComment();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={displayImage || ""} alt={displayName} />
            <AvatarFallback>
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(post)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(post.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Contenu du post */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Images du post */}
          {post.images && post.images.length > 0 && (
            <div className="grid gap-1">
              {post.images.length === 1 ? (
                <div className="relative aspect-video max-h-32 rounded-lg overflow-hidden">
                  <Image
                    src={post.images[0]}
                    alt="Image du post"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {post.images.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square max-h-16 rounded-lg overflow-hidden"
                    >
                      <Image
                        src={image}
                        alt={`Image ${index + 1} du post`}
                        fill
                        className="object-cover"
                      />
                      {post.images.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
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
          <div className="flex items-center space-x-4 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-red-500"
            >
              <Heart className="h-4 w-4 mr-2" />
              J'aime
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-muted-foreground hover:text-blue-500"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Commenter
            </Button>
          </div>

          {/* Section commentaires */}
          {showComments && (
            <div className="space-y-4 pt-4 border-t">
              <CommentSection postId={post.id} />

              {/* Nouveau commentaire */}
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">U</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Écrivez un commentaire..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[60px] resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!commentText.trim() || isSubmittingComment}
                      onClick={handleComment}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmittingComment ? "Envoi..." : "Commenter"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
