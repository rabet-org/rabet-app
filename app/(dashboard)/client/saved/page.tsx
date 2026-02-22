import { SavedProvidersClient } from "./saved-client";

export default async function SavedProvidersPage() {
  // TODO: Implement saved providers from database
  // For now, return empty array
  const saved: any[] = [];

  return <SavedProvidersClient initialSaved={saved} />;
}
