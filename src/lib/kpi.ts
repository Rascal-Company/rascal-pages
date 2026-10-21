/**
 * Dashboardin tunnusluvut: jakson luvut ja muutos edelliseen yhtä pitkään jaksoon.
 */

export type KpiPair = { current: number; previous: number };

export type SiteKpis = {
  views: KpiPair;
  leads: KpiPair;
};

export const KPI_PERIOD_DAYS = 30;

/** Jakson alku- ja vertailujakson alkuhetki (ISO). */
export function kpiWindows(now: Date, days = KPI_PERIOD_DAYS) {
  const ms = days * 24 * 60 * 60 * 1000;
  return {
    since: new Date(now.getTime() - ms).toISOString(),
    previousSince: new Date(now.getTime() - 2 * ms).toISOString(),
  };
}

/** Muutos prosentteina; null, kun vertailukohtaa ei ole (edellinen jakso 0). */
export function percentChange({ current, previous }: KpiPair): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Konversio prosentteina yhdellä desimaalilla; 0, kun näyttöjä ei ole. */
export function conversionPercent(leads: number, views: number): number {
  if (views <= 0) return 0;
  return Math.round((leads / views) * 1000) / 10;
}

export function sumKpis(list: SiteKpis[]): SiteKpis {
  return list.reduce<SiteKpis>(
    (acc, k) => ({
      views: {
        current: acc.views.current + k.views.current,
        previous: acc.views.previous + k.views.previous,
      },
      leads: {
        current: acc.leads.current + k.leads.current,
        previous: acc.leads.previous + k.leads.previous,
      },
    }),
    { views: { current: 0, previous: 0 }, leads: { current: 0, previous: 0 } },
  );
}
