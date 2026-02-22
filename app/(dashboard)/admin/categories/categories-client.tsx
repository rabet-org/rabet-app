"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Topbar } from "@/components/layout/topbar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  UploadSimpleIcon,
  SpinnerIcon,
  ArrowRightIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAlertHelpers } from "@/components/ui/alert-toast";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
};

function isUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://");
}

function CategoryIcon({
  icon,
  size = 32,
}: {
  icon: string | null;
  size?: number;
}) {
  if (!icon) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-lg bg-muted text-muted-foreground"
        style={{ width: size, height: size }}
      >
        <TagIcon size={size * 0.55} />
      </span>
    );
  }
  if (isUrl(icon)) {
    return (
      <Image
        src={icon}
        alt="category icon"
        width={size}
        height={size}
        className="rounded-lg object-contain bg-muted"
        style={{ width: size, height: size }}
      />
    );
  }
  return <span style={{ fontSize: size * 0.75 }}>{icon}</span>;
}

export function CategoriesClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const { success, error, confirm } = useAlertHelpers();

  // Form state (shared between create + edit)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [isActive, setIsActive] = useState(true);

  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Derived filtered list
  const filtered = categories.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.is_active) ||
      (statusFilter === "inactive" && !c.is_active);
    return matchesSearch && matchesStatus;
  });

  const refreshCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories?limit=100", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleIconUpload = useCallback(
    async (file: File, onDone: (url: string) => void) => {
      if (file.size > 2 * 1024 * 1024) {
        await error("Icon must be under 2 MB");
        return;
      }
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "category-icons");
        const res = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          onDone(data.url);
        } else {
          const errData = await res.json();
          await error(errData.error?.message || "Failed to upload icon");
        }
      } catch {
        await error("Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [error],
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setIcon("");
    setIsActive(true);
  };

  const handleCreate = async () => {
    if (!name) {
      await error("Name is required");
      return;
    }
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    if (!generatedSlug) {
      await error("Please enter a valid name");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: generatedSlug,
          name,
          description: description || null,
          icon: icon || null,
          is_active: isActive,
        }),
      });
      if (res.ok) {
        setIsCreateOpen(false);
        resetForm();
        await refreshCategories();
        await success("Category created");
      } else {
        const d = await res.json();
        await error(
          d.error?.message || d.message || "Failed to create category",
        );
      }
    } catch {
      await error("Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCategory || !name) {
      await error("Name is required");
      return;
    }
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    if (!generatedSlug) {
      await error("Please enter a valid name");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: generatedSlug,
          name,
          description: description || null,
          icon: icon || null,
          is_active: isActive,
        }),
      });
      if (res.ok) {
        setIsEditOpen(false);
        setSelectedCategory(null);
        resetForm();
        await refreshCategories();
        await success("Category updated");
      } else {
        const d = await res.json();
        await error(
          d.error?.message || d.message || "Failed to update category",
        );
      }
    } catch {
      await error("Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    const confirmed = await confirm(
      `Are you sure you want to delete "${selectedCategory.name}"?`,
      "Delete Category",
    );
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setIsEditOpen(false);
        setSelectedCategory(null);
        await refreshCategories();
        await success("Category deleted");
      } else {
        const d = await res.json();
        await error(
          d.error?.message || d.message || "Failed to delete category",
        );
      }
    } catch {
      await error("Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setIcon(category.icon || "");
    setIsActive(category.is_active);
    setIsEditOpen(true);
  };

  // Shared icon upload UI
  function IconUploadField({
    value,
    onChange,
    inputRef,
  }: {
    value: string;
    onChange: (url: string) => void;
    inputRef: React.RefObject<HTMLInputElement>;
  }) {
    return (
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl border bg-muted/60 flex items-center justify-center overflow-hidden shrink-0">
            {value ? (
              <CategoryIcon icon={value} size={48} />
            ) : (
              <TagIcon size={22} className="text-muted-foreground/50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
              >
                {isUploading ? (
                  <SpinnerIcon className="size-3.5 animate-spin" />
                ) : (
                  <UploadSimpleIcon className="size-3.5" />
                )}
                {isUploading ? "Uploading…" : "Upload icon"}
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onChange("")}
                >
                  <XIcon className="size-3.5" />
                  Remove
                </Button>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Recommended: <strong>128×128 px</strong> · PNG, SVG or WebP · Max{" "}
              <strong>2 MB</strong>
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleIconUpload(file, onChange);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Categories" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Service Categories
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Manage service categories for the platform
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="mr-2 size-4" />
            Add Category
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "all" | "active" | "inactive")
            }
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {search || statusFilter !== "all"
                        ? "No categories match your filters"
                        : "No categories found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((category) => (
                    <TableRow
                      key={category.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => openEditDialog(category)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <CategoryIcon icon={category.icon} size={32} />
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                        {category.description || "—"}
                      </TableCell>
                      <TableCell>
                        {category.is_active ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          >
                            <CheckCircleIcon className="mr-1 size-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-muted text-muted-foreground"
                          >
                            <XCircleIcon className="mr-1 size-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
              {filtered.length}{" "}
              {filtered.length === 1 ? "category" : "categories"}
              {(search || statusFilter !== "all") &&
                ` · filtered from ${categories.length} total`}
            </div>
          )}
        </div>

        {/* ── Edit Dialog (opens when row is clicked) ─────────────────────── */}
        <Dialog
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              setSelectedCategory(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
            {/* Coloured header band */}
            <div className="relative flex items-center gap-4 px-6 py-5 bg-muted/50 border-b">
              <div className="size-14 rounded-2xl border bg-background shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                <CategoryIcon
                  icon={icon || selectedCategory?.icon || null}
                  size={44}
                />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold truncate">
                  {selectedCategory?.name}
                </DialogTitle>
                <DialogDescription className="mt-0.5 flex items-center gap-1.5">
                  <code className="text-[11px] bg-background border px-1.5 py-0.5 rounded font-mono text-muted-foreground line-through decoration-muted-foreground/50">
                    {selectedCategory?.slug}
                  </code>
                  {selectedCategory?.is_active ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircleIcon className="size-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                      <XCircleIcon className="size-3" /> Inactive
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>

            {/* Form body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label
                    htmlFor="edit-name"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    Name *
                  </Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5"
                  />
                  {name && name !== selectedCategory?.name && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      New Slug:{" "}
                      <code className="bg-muted px-1 py-0.5 rounded font-mono text-[10px] text-foreground">
                        /categories/
                        {name
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)+/g, "")}
                      </code>
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label
                    htmlFor="edit-description"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5 resize-none"
                    rows={2}
                  />
                </div>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4">
                <IconUploadField
                  value={icon}
                  onChange={setIcon}
                  inputRef={
                    editFileInputRef as React.RefObject<HTMLInputElement>
                  }
                />
              </div>

              <div className="flex items-center gap-2.5 px-1 py-1">
                <Switch
                  id="edit-is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label
                  htmlFor="edit-is-active"
                  className="cursor-pointer text-sm font-medium"
                >
                  Active
                </Label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:border-rose-500/30"
                onClick={handleDelete}
                disabled={isProcessing}
              >
                <TrashIcon className="size-3.5" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedCategory(null);
                    resetForm();
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={isProcessing || isUploading}
                >
                  {isProcessing ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Create Dialog ────────────────────────────────────────────────── */}
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
              <DialogDescription>
                Add a new service category to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Web Development"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5"
                />
                {name && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
                    Preview:{" "}
                    <code className="bg-muted px-1 py-0.5 rounded font-mono text-[10px] text-foreground">
                      /categories/
                      {name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, "")}
                    </code>
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Category description…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              <IconUploadField
                value={icon}
                onChange={setIcon}
                inputRef={
                  createFileInputRef as React.RefObject<HTMLInputElement>
                }
              />

              <div className="flex items-center gap-2.5 px-1 py-1">
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label
                  htmlFor="is-active"
                  className="cursor-pointer text-sm font-medium"
                >
                  Active
                </Label>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={isProcessing || isUploading}
                >
                  {isProcessing ? "Creating…" : "Create Category"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
