"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageCircle, Send, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface CommentLikes {
  count: number;
  isLiked: boolean;
}

interface LikeUser {
  id: number;
  userId: number | null;
  companyId: number | null;
  createdAt: Date;
  userName: string | null;
  userImage: string | null;
  userGradient: { color1: string; color2: string; css: string } | null;
  companyName: string | null;
  companyLogo: string | null;
  companyGradient: { color1: string; color2: string; css: string } | null;
}

interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  userId: number | null;
  companyId: number | null;
  parentId: number | null;
  userName: string | null;
  userImage: string | null;
  userGradient: { color1: string; color2: string; css: string } | null;
  companyName: string | null;
  companyLogo: string | null;
  companyGradient: { color1: string; color2: string; css: string } | null;
  replies?: Comment[];
  likes?: CommentLikes;
}

interface CommentSectionProps {
  postId: number;
  onCommentAdded?: () => void;
}

export function CommentSection({ postId, onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: number]: string }>({});
  const [submittingReply, setSubmittingReply] = useState<{ [key: number]: boolean }>({});
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [likesDialogCommentId, setLikesDialogCommentId] = useState<number | null>(null);
  const [likesList, setLikesList] = useState<LikeUser[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchComments = useCallback(async () => {
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
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleToggleLike = useCallback(async (commentId: number, currentLikes: CommentLikes | undefined) => {
    if (!currentLikes) return;

    const isLiked = currentLikes.isLiked;
    const method = isLiked ? "DELETE" : "POST";

    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}/likes`, {
        method,
      });

      if (response.ok) {
        // Rafraîchir les commentaires pour mettre à jour les likes
        await fetchComments();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible de modifier le like",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors du toggle du like:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  }, [postId, fetchComments, toast]);

  const handleReply = useCallback((commentId: number) => {
    setReplyingTo((prev) => {
      if (prev === commentId) {
        setReplyContent((prevContent) => {
          const newContent = { ...prevContent };
          delete newContent[commentId];
          return newContent;
        });
        return null;
      } else {
        setReplyContent((prevContent) => ({
          ...prevContent,
          [commentId]: "",
        }));
        return commentId;
      }
    });
  }, []);

  const handleReplyChange = useCallback((commentId: number, value: string) => {
    setReplyContent((prev) => ({
      ...prev,
      [commentId]: value,
    }));
  }, []);

  const handleCancelReply = useCallback((commentId: number) => {
    setReplyingTo(null);
    setReplyContent((prev) => {
      const newContent = { ...prev };
      delete newContent[commentId];
      return newContent;
    });
  }, []);

  const handleShowLikes = useCallback(async (commentId: number) => {
    setLikesDialogCommentId(commentId);
    setLikesDialogOpen(true);
    setLoadingLikes(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}/likes?list=true`);
      if (response.ok) {
        const data = await response.json();
        setLikesList(data.likes || []);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des likes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des likes:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoadingLikes(false);
    }
  }, [postId, toast]);

  const handleSubmitReply = useCallback(async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    setSubmittingReply((prev) => {
      if (prev[parentId]) return prev;
      return { ...prev, [parentId]: true };
    });

    setReplyContent((prevContent) => {
      const content = prevContent[parentId]?.trim();
      if (!content) {
        setSubmittingReply((prev) => ({ ...prev, [parentId]: false }));
        return prevContent;
      }

      (async () => {
        try {
          const response = await fetch(`/api/posts/${postId}/comments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content, parentId }),
          });

          if (response.ok) {
            setReplyContent((prev) => {
              const newContent = { ...prev };
              delete newContent[parentId];
              return newContent;
            });
            setReplyingTo(null);
            await fetchComments();
            toast({
              title: "Réponse ajoutée",
              description: "Votre réponse a été publiée avec succès.",
            });
            onCommentAdded?.();
          } else {
            const error = await response.json();
            toast({
              title: "Erreur",
              description: error.error || "Impossible d'ajouter la réponse",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Erreur lors de l'ajout de la réponse:", error);
          toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de l'ajout de la réponse",
            variant: "destructive",
          });
        } finally {
          setSubmittingReply((prev) => ({ ...prev, [parentId]: false }));
        }
      })();

      return prevContent;
    });
  }, [postId, fetchComments, toast, onCommentAdded]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        setNewComment("");
        await fetchComments();
        toast({
          title: "Commentaire ajouté",
          description: "Votre commentaire a été publié avec succès.",
        });
        onCommentAdded?.();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible d'ajouter le commentaire",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du commentaire",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Chargement des commentaires...
      </div>
    );
  }

  // Composant CommentItem mémorisé pour éviter les re-renders inutiles
  const CommentItem = memo(({
    comment,
    isReply = false,
    replyingTo,
    replyContent,
    submittingReply,
    onToggleLike,
    onReply,
    onReplyChange,
    onSubmitReply,
    onCancelReply,
    onShowLikes,
  }: {
    comment: Comment;
    isReply?: boolean;
    replyingTo: number | null;
    replyContent: { [key: number]: string };
    submittingReply: { [key: number]: boolean };
    onToggleLike: (commentId: number, likes: CommentLikes | undefined) => void;
    onReply: (commentId: number) => void;
    onReplyChange: (commentId: number, value: string) => void;
    onSubmitReply: (e: React.FormEvent, parentId: number) => void;
    onCancelReply: (commentId: number) => void;
    onShowLikes: (commentId: number) => void;
  }) => {
    const displayName =
      comment.companyName || comment.userName || "Utilisateur inconnu";
    const displayImage = comment.companyLogo || comment.userImage;
    const gradient = comment.companyGradient || comment.userGradient;
    const likes = comment.likes || { count: 0, isLiked: false };
    const isReplying = replyingTo === comment.id;
    const currentReplyContent = replyContent[comment.id] || "";
    const isSubmitting = submittingReply[comment.id] || false;

    const onProfileClick = useCallback(() => {
      if (comment.userId) {
        router.push(`/user/${comment.userId}`);
      } else if (comment.companyId && comment.companyName) {
        router.push(`/company/${encodeURIComponent(comment.companyName)}`);
      }
    }, [comment.userId, comment.companyId, comment.companyName]);

    return (
      <div className={`flex gap-3 ${isReply ? "ml-8 mt-3" : ""}`}>
        <Avatar
          className={`flex-shrink-0 ${isReply ? "h-7 w-7" : "h-9 w-9"} border border-border rounded-full cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={onProfileClick}
        >
          <AvatarImage src={displayImage || ""} alt={displayName} />
          <AvatarFallback
            className={`${isReply ? "text-xs" : "text-sm"} text-white font-semibold`}
            style={
              !displayImage && gradient
                ? { background: gradient.css }
                : undefined
            }
          >
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-background border border-border rounded-lg p-3 hover:border-border/80 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-semibold text-sm text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={onProfileClick}
                >
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>
          </div>

          {!isReply && (
            <div className="flex items-center gap-1 mt-2 ml-1">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 text-xs ${
                    likes.isLiked
                      ? "text-red-500 hover:text-red-600"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => onToggleLike(comment.id, likes)}
                >
                  <Heart
                    className={`h-3 w-3 mr-1.5 ${
                      likes.isLiked ? "fill-current" : ""
                    }`}
                  />
                  <span>J&apos;aime</span>
                </Button>
                {likes.count > 0 && (
                  <button
                    onClick={() => onShowLikes(comment.id)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {likes.count}
                  </button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onReply(comment.id)}
              >
                <MessageCircle className="h-3 w-3 mr-1.5" />
                Répondre
              </Button>
            </div>
          )}

          {/* Formulaire de réponse inline */}
          {!isReply && isReplying && (
            <form
              onSubmit={(e) => onSubmitReply(e, comment.id)}
              className="mt-3 space-y-2"
            >
              <Textarea
                placeholder="Écrire une réponse..."
                value={currentReplyContent}
                onChange={(e) => onReplyChange(comment.id, e.target.value)}
                className="min-h-[70px] resize-none text-sm"
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancelReply(comment.id)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!currentReplyContent.trim() || isSubmitting}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Publication..." : "Publier"}
                </Button>
              </div>
            </form>
          )}

          {/* Afficher les réponses */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3 border-l-2 border-border/30 pl-4 ml-1">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply={true}
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  submittingReply={submittingReply}
                  onToggleLike={onToggleLike}
                  onReply={onReply}
                  onReplyChange={onReplyChange}
                  onSubmitReply={onSubmitReply}
                  onCancelReply={onCancelReply}
                  onShowLikes={onShowLikes}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  });

  CommentItem.displayName = "CommentItem";

  return (
    <div className="space-y-4">
      {/* Formulaire de création de commentaire */}
      <form onSubmit={handleSubmitComment} className="space-y-3 pb-4 border-b border-border">
        <Textarea
          placeholder="Ajouter un commentaire..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[90px] resize-none text-sm"
          disabled={submitting}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || submitting}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Publication..." : "Publier"}
          </Button>
        </div>
      </form>

      {/* Liste des commentaires */}
      {comments.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-lg">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Aucun commentaire pour le moment.</p>
          <p className="text-xs mt-1">Soyez le premier à commenter !</p>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replyingTo={replyingTo}
              replyContent={replyContent}
              submittingReply={submittingReply}
              onToggleLike={handleToggleLike}
              onReply={handleReply}
              onReplyChange={handleReplyChange}
              onSubmitReply={handleSubmitReply}
              onCancelReply={handleCancelReply}
              onShowLikes={handleShowLikes}
            />
          ))}
        </div>
      )}

      {/* Dialog pour afficher la liste des likes */}
      <Dialog open={likesDialogOpen} onOpenChange={setLikesDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {likesList.length} {likesList.length === 1 ? "personne a aimé" : "personnes ont aimé"}
            </DialogTitle>
          </DialogHeader>
          {loadingLikes ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Chargement...</div>
            </div>
          ) : likesList.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Aucun like pour le moment
            </div>
          ) : (
            <div className="space-y-3">
              {likesList.map((like) => {
                const displayName = like.companyName || like.userName || "Utilisateur inconnu";
                const displayImage = like.companyLogo || like.userImage;
                const gradient = like.companyGradient || like.userGradient;

                return (
                  <div key={like.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border rounded-full">
                      <AvatarImage src={displayImage || ""} alt={displayName} />
                      <AvatarFallback
                        className="text-sm text-white font-semibold"
                        style={
                          !displayImage && gradient
                            ? { background: gradient.css }
                            : undefined
                        }
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground">
                        {displayName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(like.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
