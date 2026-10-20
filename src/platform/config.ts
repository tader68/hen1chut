export const cloudConfig = {
  url: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined,
};
export const cloudConfigured = Boolean(cloudConfig.url && cloudConfig.key);
