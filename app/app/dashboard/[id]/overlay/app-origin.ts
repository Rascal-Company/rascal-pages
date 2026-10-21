import { headers } from "next/headers";

/** Sovelluksen origin pyynnön hostista (esim. https://app.rascalpages.fi). */
export async function getAppOrigin(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "app.rascalpages.fi";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}
