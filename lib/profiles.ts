import { supabase } from "@/lib/supabase";

export type ProfileData = {
  full_name: string | null;
  phone: string | null;
  address: string | null;
};

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export async function fetchProfileById(
  userId: string
): Promise<ProfileData | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, phone, address")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  // The shape is dynamic unless you generate Supabase types.
  return {
    full_name: (data as any).full_name ?? null,
    phone: (data as any).phone ?? null,
    address: (data as any).address ?? null,
  };
}

export async function upsertProfileById(
  userId: string,
  profile: ProfileData
): Promise<void> {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    ...profile,
  });

  if (error) throw error;
}

export async function ensureProfileFromUserMetadata(
  userId: string,
  userMetadata: Record<string, unknown> | null | undefined
): Promise<void> {
  if (!userMetadata) return;

  const next: ProfileData = {
    full_name: asStringOrNull(userMetadata["full_name"]),
    phone: asStringOrNull(userMetadata["phone"]),
    address: asStringOrNull(userMetadata["address"]),
  };

  if (!next.full_name && !next.phone && !next.address) return;

  // If a profile already exists, do nothing.
  const existing = await fetchProfileById(userId);
  if (existing) return;

  await upsertProfileById(userId, next);
}
