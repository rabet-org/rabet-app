import { Topbar } from "@/components/layout/topbar";
import { db } from "@/lib/db";
import { CategoriesClient } from "./categories-client";

async function getCategories() {
  return db.category.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      icon: true,
      is_active: true,
    },
    orderBy: { name: "asc" },
  });
}

export default async function AdminCategoriesPage() {
  let categories;
  try {
    categories = await getCategories();
  } catch {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Categories" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Error loading categories. Please try again later.
          </div>
        </main>
      </div>
    );
  }

  return <CategoriesClient initialCategories={categories} />;
}
