"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageCircle, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  userId: number | null;
  companyId: number | null;
  parentId: number | null;
  userName: string | null;
  userImage: string | null;
  companyName: string | null;
  companyLogo: string | null;
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: number;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des commentaires:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Chargement des commentaires...
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Aucun commentaire pour le moment.
      </div>
    );
  }

  const CommentItem = ({
    comment,
    isReply = false,
  }: {
    comment: Comment;
    isReply?: boolean;
  }) => {
    const displayName =
      comment.companyName || comment.userName || "Utilisateur inconnu";
    const displayImage = comment.companyLogo || comment.userImage;

    return (
      <div className={`flex space-x-3 ${isReply ? "ml-12" : ""}`}>
        <Avatar className={`flex-shrink-0 ${isReply ? "h-6 w-6" : "h-8 w-8"}`}>
          <AvatarImage src={displayImage || ""} alt={displayName} />
          <AvatarFallback className={isReply ? "text-xs" : ""}>
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="bg-muted rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm">{displayName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          {!isReply && (
            <div className="flex items-center space-x-2 ml-3">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                J'aime
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                Répondre
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Afficher les réponses */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-3 mt-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
