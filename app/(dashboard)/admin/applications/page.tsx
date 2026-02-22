import { db } from "@/lib/db";
import AdminApplicationsClient from "./client-page";

async function getApplications() {
  const [applications, categories] = await Promise.all([
    db.providerApplication.findMany({
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: { full_name: true, phone: true, avatar_url: true },
            },
          },
        },
        provider_profile: {
          include: {
            services: {
              include: {
                category: { select: { id: true, name: true, icon: true } },
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    }),
    db.category.findMany({ select: { id: true, name: true, icon: true } }),
  ]);

  const categoryMap = new Map(
    categories.map((c) => [c.id, { name: c.name, icon: c.icon }]),
  );

  return applications.map((app) => {
    let services: { id: string; name: string; icon: string | null }[] = [];
    if (app.provider_profile?.services?.length) {
      services = app.provider_profile.services.map((ps) => ({
        id: ps.category.id,
        name: ps.category.name,
        icon: ps.category.icon,
      }));
    } else {
      const docs = app.verification_docs as Record<string, unknown>;
      if (docs && Array.isArray(docs.services)) {
        services = (docs.services as string[]).map((id) => ({
          id,
          name: categoryMap.get(id)?.name || "Unknown",
          icon: categoryMap.get(id)?.icon || null,
        }));
      }
    }
    return {
      id: app.id,
      provider_type: app.provider_type,
      business_name: app.business_name,
      description: app.description,
      portfolio_url: app.portfolio_url,
      application_status: app.application_status,
      rejection_reason: app.rejection_reason,
      reviewed_at: app.reviewed_at?.toISOString() ?? null,
      created_at: app.created_at.toISOString(),
      applicant: {
        id: app.user_id,
        email: app.user.email,
        full_name: app.user.profile?.full_name ?? null,
        phone: app.user.profile?.phone ?? null,
        avatar_url: app.user.profile?.avatar_url ?? null,
      },
      services,
    };
  });
}

export default async function AdminApplicationsPage() {
  let apps;
  try {
    apps = await getApplications();
  } catch {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading applications data.
      </div>
    );
  }
  return <AdminApplicationsClient initialData={apps} />;
}
