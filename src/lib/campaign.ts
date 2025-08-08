export type CampaignSettings = {
  title: string;
  imageUrl: string;
};

const DEFAULT_SETTINGS: CampaignSettings = {
  title: 'EDIÇÃO 76 - NOVO TERA 2026 0KM',
  imageUrl: 'https://s3.incrivelsorteios.com/redimensiona?key=600x600/20250731_688b54af15d40.jpg',
};

import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function getCampaignSettings(): Promise<CampaignSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('id', 'campaign')
      .single();

    if (error || !data || !('value' in data)) {
      return DEFAULT_SETTINGS;
    }

    const value = (data as { value: Partial<CampaignSettings> | null }).value;
    return { ...DEFAULT_SETTINGS, ...(value || {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}


