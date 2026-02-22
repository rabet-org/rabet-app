"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  StarIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { useAlertHelpers } from "@/components/ui/alert-toast";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: Date;
  provider: {
    user: {
      profile: {
        full_name: string;
        avatar_url: string | null;
      };
    };
  };
  request: {
    title: string;
  };
};

export function ReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);
  const { success, error } = useAlertHelpers();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews/me");
      if (res.ok) {
        const json = await res.json();
        setReviews(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditComment(review.comment || "");
    setEditRating(review.rating);
  };

  const handleUpdate = async () => {
    if (!editingReview) return;

    try {
      const res = await fetch(`/api/reviews/${editingReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: editRating,
          comment: editComment,
        }),
      });

      if (res.ok) {
        setReviews(
          reviews.map((r) =>
            r.id === editingReview.id
              ? { ...r, rating: editRating, comment: editComment }
              : r
          )
        );
        setEditingReview(null);
        success("Review updated successfully");
      } else {
        error("Failed to update review");
      }
    } catch (err) {
      error("Network error occurred");
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setReviews(reviews.filter((r) => r.id !== reviewId));
        success("Review deleted successfully");
      } else {
        error("Failed to delete review");
      }
    } catch (err) {
      error("Network error occurred");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">My Reviews</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reviews you've written for providers
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">My Reviews</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reviews you've written for providers
          </p>
        </div>
        <EmptyState
          icon={StarIcon}
          title="No reviews yet"
          description="You haven't written any reviews for providers"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My Reviews</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {review.provider.user.profile.avatar_url ? (
                  <img
                    src={review.provider.user.profile.avatar_url}
                    alt={review.provider.user.profile.full_name}
                    className="size-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="size-6 text-primary" />
                  </div>
                )}
                <div>
                  <div className="font-semibold">
                    {review.provider.user.profile.full_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {review.request.title}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(review)}
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(review.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className="size-5"
                  weight={star <= review.rating ? "fill" : "regular"}
                  color={star <= review.rating ? "#f59e0b" : "currentColor"}
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {format(new Date(review.created_at), "MMM d, yyyy")}
              </span>
            </div>

            {review.comment && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingReview}
        onOpenChange={(open) => !open && setEditingReview(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditRating(star)}
                  >
                    <StarIcon
                      className="size-8 cursor-pointer transition-colors"
                      weight={star <= editRating ? "fill" : "regular"}
                      color={star <= editRating ? "#f59e0b" : "currentColor"}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Comment</label>
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={4}
                placeholder="Share your experience..."
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleUpdate} className="flex-1">
                Update Review
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingReview(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
