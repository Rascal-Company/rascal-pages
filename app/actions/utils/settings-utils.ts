type AnalyticsSettings = {
  googleTagManagerId?: string;
  metaPixelId?: string;
};

/**
 * Merge new analytics settings with existing settings
 * Preserves existing keys not in the new settings
 */
export function mergeSettings(
  currentSettings: Record<string, unknown>,
  newSettings: AnalyticsSettings,
): Record<string, unknown> {
  return {
    ...currentSettings,
    ...newSettings,
  };
}
