import { demoSocialLinks } from "./demo-data";
import { getServiceSupabase, hasSupabaseEnv } from "./supabase";
import type { SocialLinks } from "./types";

type SocialLinksRow = {
  whatsapp_group?: string | null;
  whatsapp_support?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  telegram?: string | null;
};

type SupportSettingsRow = {
  enabled?: boolean | null;
  label?: string | null;
  whatsapp_support?: string | null;
};

function clean(value?: string | null): string | undefined {
  const text = value?.trim();
  return text ? text : undefined;
}

export async function getPublicSocialLinks(): Promise<SocialLinks> {
  if (!hasSupabaseEnv()) return demoSocialLinks;

  const supabase = getServiceSupabase();
  const [{ data: social }, { data: support }] = await Promise.all([
    supabase
      .from("social_links")
      .select("whatsapp_group, whatsapp_support, instagram, tiktok, youtube, telegram")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<SocialLinksRow>(),
    supabase
      .from("support_settings")
      .select("enabled, label, whatsapp_support")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<SupportSettingsRow>(),
  ]);

  return {
    whatsappGroup: clean(social?.whatsapp_group),
    whatsappSupport: clean(support?.whatsapp_support) ?? clean(social?.whatsapp_support),
    supportEnabled: support?.enabled ?? Boolean(clean(support?.whatsapp_support) ?? clean(social?.whatsapp_support)),
    supportLabel: clean(support?.label),
    instagram: clean(social?.instagram),
    tiktok: clean(social?.tiktok),
    youtube: clean(social?.youtube),
    telegram: clean(social?.telegram),
  };
}
