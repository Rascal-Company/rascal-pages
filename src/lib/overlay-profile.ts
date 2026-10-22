/**
 * Kohderyhmäprofiilin kuvaus Rascal AI:n jäsennellystä datasta (icp_summary).
 * Kuvaus on käyttäjän muokattavaa tekstiä ja menee sellaisenaan AI:lle,
 * joten JSON muotoillaan otsikoiduiksi kappaleiksi.
 */

const LABELS: Record<string, string> = {
  value: "Mitä asiakkaat arvostavat",
  audiences: "Kohderyhmät",
  common_problem: "Yleisin ongelma",
  paying_audience: "Tärkein maksava asiakas",
};

function label(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const text = key.replace(/[_-]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map(formatValue)
      .filter(Boolean)
      .map((item) => `• ${item}`)
      .join("\n");
  }
  if (typeof value === "object") return formatObject(value as Record<string, unknown>);
  return String(value).trim();
}

function formatObject(record: Record<string, unknown>): string {
  return Object.entries(record)
    .map(([key, value]) => {
      const text = formatValue(value);
      return text ? `${label(key)}:\n${text}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

/** Muotoilee JSON-arvon (myös JSON-merkkijonon) luettavaksi tekstiksi. */
export function describeProfileData(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^[{[]/.test(trimmed)) return trimmed;
    try {
      return formatValue(JSON.parse(trimmed));
    } catch {
      return trimmed;
    }
  }
  return formatValue(value);
}
