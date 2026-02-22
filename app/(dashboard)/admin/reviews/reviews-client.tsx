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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StarIcon,
  TrashIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
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
  initialTotal,
  initialSearch = "",
}: {
  initialReviews: Review[];
  initialTotal: number;
  initialSearch?: string;
}) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { success, error } = useAlertHelpers();

  // Filter & Sort Logic
  const filteredReviews = reviews
    .filter((review) => {
      const matchesSearch =
        review.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (review.client.full_name &&
          review.client.full_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        review.provider.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.provider.email
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (review.provider.full_name &&
          review.provider.full_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchesRating =
        ratingFilter === "all" || review.rating.toString() === ratingFilter;

      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

  const handleDelete = async (reviewId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason }),
      });

      if (res.ok) {
        setReviews(reviews.filter((r) => r.id !== reviewId));
        setSelectedReview(null);
        setIsConfirmingDelete(false);
        setDeleteReason("");
        await success("Review deleted successfully");
      } else {
        const errorData = await res.json();
        await error(
          errorData.error?.message ||
            errorData.message ||
            "Failed to delete review",
        );
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
          <p className="text-xs text-muted-foreground mt-0.5">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filteredReviews.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {initialTotal.toLocaleString()}
            </span>{" "}
            reviews
          </p>
        </div>

        {reviews.length >= 100 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <span className="font-semibold">⚠</span>
            Results are limited to 100 records. Use search and filters to narrow
            down.
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-3 items-center mb-6">
          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4.5" />
            <Input
              placeholder="Search comments, client, or provider..."
              className="pl-9 bg-card shadow-sm border-border/50 focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-fit bg-card shadow-sm border-border/50 shrink-0">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Rating" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-fit bg-card shadow-sm border-border/50 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    Sort by
                  </span>
                  <SelectValue placeholder="Sort..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest">Highest Rating</SelectItem>
                <SelectItem value="lowest">Lowest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No reviews found in the system
                    </TableCell>
                  </TableRow>
                ) : filteredReviews.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <MagnifyingGlassIcon className="size-8 text-muted-foreground/50" />
                        <p>No reviews match your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReviews.map((review) => (
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
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="max-w-[250px] sm:max-w-[400px] truncate">
                          {review.comment}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm shrink-0">
                          {format(new Date(review.created_at), "MMM d, yyyy")}
                        </div>
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
          onOpenChange={(open) => {
            if (!open) {
              setSelectedReview(null);
              setIsConfirmingDelete(false);
              setDeleteReason("");
            }
          }}
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
                    {format(
                      new Date(selectedReview.created_at),
                      "MMMM d, yyyy 'at' h:mm a",
                    )}
                  </div>
                </div>

                {/* Delete Section */}
                {!isConfirmingDelete ? (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setIsConfirmingDelete(true)}
                  >
                    <TrashIcon className="mr-2 size-4" />
                    Delete Review
                  </Button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-sm font-semibold text-destructive">
                      Provide a reason for removal
                    </p>
                    <Textarea
                      placeholder="e.g. Spam, inappropriate content, fake review..."
                      rows={2}
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setIsConfirmingDelete(false);
                          setDeleteReason("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDelete(selectedReview.id)}
                        disabled={isDeleting || !deleteReason.trim()}
                      >
                        <TrashIcon className="mr-2 size-4" />
                        {isDeleting ? "Deleting..." : "Confirm Delete"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
