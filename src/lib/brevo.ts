const BREVO_CONTACTS_URL = "https://api.brevo.com/v3/contacts";

export type BrevoContact = {
  email: string;
  listIds: number[];
};

/** Rakentaa Brevon contacts-kutsun rungon; olemassa oleva kontakti liitetään listalle. */
export function brevoContactBody(contact: BrevoContact) {
  return { email: contact.email, listIds: contact.listIds, updateEnabled: true };
}

/** Lukee listan ID:n env-arvosta; null jos puuttuu tai ei ole positiivinen kokonaisluku. */
export function parseBrevoListId(raw: string | undefined): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Lisää kontaktin Brevo-listalle. Palauttaa false jos avain/lista puuttuu tai
 * kutsu epäonnistuu — kutsujan ei pidä kaatua tähän.
 */
export async function addBrevoContact(
  email: string,
  listIdEnv: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = parseBrevoListId(listIdEnv);
  if (!apiKey || !listId) {
    console.warn("Brevo-synkka ohitettu: BREVO_API_KEY tai listan ID puuttuu.");
    return false;
  }

  try {
    const res = await fetchImpl(BREVO_CONTACTS_URL, {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(brevoContactBody({ email, listIds: [listId] })),
    });
    // 201 = luotu, 204 = olemassa oleva päivitetty.
    if (res.ok) return true;
    console.error("Brevo-synkka epäonnistui:", res.status, await res.text());
    return false;
  } catch (error) {
    console.error("Brevo-synkka epäonnistui:", error);
    return false;
  }
}
