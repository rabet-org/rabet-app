"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  StarIcon,
  TrashIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { useAlertHelpers } from "@/components/ui/alert-toast";

type Review = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  client: {
    email: string;
    full_name: string | null;
  };
  provider: {
    id: string;
    email: string;
    full_name: string | null;
  };
};

export default function ReviewsClient({
  initialReviews,
}: {
  initialReviews: Review[];
}) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error, confirm } = useAlertHelpers();

  const handleDelete = async (reviewId: string) => {
    const confirmed = await confirm(
      "Are you sure you want to delete this review? This action cannot be undone.",
      "Delete Review"
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setReviews(reviews.filter((r) => r.id !== reviewId));
        setSelectedReview(null);
        await success("Review deleted successfully");
      } else {
        const errorData = await res.json();
        await error(errorData.error?.message || errorData.message || "Failed to delete review");
      }
    } catch (e) {
      await error("Network error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`size-4 ${
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
            }`}
            weight={star <= rating ? "fill" : "regular"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Reviews Management" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 pb-20">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Platform Reviews
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor and manage reviews across the platform
          </p>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="w-[300px]">Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No reviews found
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow
                      key={review.id}
                      className="group cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedReview(review)}
                    >
                      <TableCell>
                        <div className="text-sm font-medium">
                          {review.client.full_name || "Anonymous"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {review.client.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {review.provider.full_name || "Provider"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {review.provider.email}
                        </div>
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground line-clamp-2">
                        {review.comment}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(review.created_at), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(review.id);
                          }}
                          disabled={isDeleting}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Review Detail Dialog */}
        <Dialog
          open={!!selectedReview}
          onOpenChange={(open) => !open && setSelectedReview(null)}
        >
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90dvh]">
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
              <DialogDescription>Full review information</DialogDescription>
            </DialogHeader>

            {selectedReview && (
              <div className="space-y-5 pb-1">
                {/* Rating */}
                <div className="flex items-center justify-center gap-3 p-4 rounded-xl border bg-muted/40">
                  {renderStars(selectedReview.rating)}
                  <span className="text-2xl font-bold">
                    {selectedReview.rating}.0
                  </span>
                </div>

                {/* Client Info */}
                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b flex items-center gap-2">
                    <UserCircleIcon className="size-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Client</h4>
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-medium">
                      {selectedReview.client.full_name || "Anonymous"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {selectedReview.client.email}
                    </div>
                  </div>
                </div>

                {/* Provider Info */}
                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b flex items-center gap-2">
                    <UserCircleIcon className="size-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Provider</h4>
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-medium">
                      {selectedReview.provider.full_name || "Provider"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {selectedReview.provider.email}
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b">
                    <h4 className="text-sm font-semibold">Comment</h4>
                  </div>
                  <p className="p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selectedReview.comment}
                  </p>
                </div>

                {/* Date */}
                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b">
                    <h4 className="text-sm font-semibold">Posted On</h4>
                  </div>
                  <div className="p-4 text-sm">
                    {format(new Date(selectedReview.created_at), "MMMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>

                {/* Delete Button */}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDelete(selectedReview.id)}
                  disabled={isDeleting}
                >
                  <TrashIcon className="mr-2 size-4" />
                  {isDeleting ? "Deleting..." : "Delete Review"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
