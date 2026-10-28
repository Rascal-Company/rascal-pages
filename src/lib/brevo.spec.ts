import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addBrevoContact, brevoContactBody, parseBrevoListId } from "./brevo";

describe("parseBrevoListId", () => {
  it("hyväksyy positiivisen kokonaisluvun", () => {
    expect(parseBrevoListId("25")).toBe(25);
  });

  it.each([undefined, "", "abc", "0", "-3", "2.5"])("hylkää %j", (raw) => {
    expect(parseBrevoListId(raw)).toBeNull();
  });
});

describe("brevoContactBody", () => {
  it("päivittää olemassa olevan kontaktin listalle", () => {
    expect(brevoContactBody({ email: "a@b.fi", listIds: [25] })).toEqual({
      email: "a@b.fi",
      listIds: [25],
      updateEnabled: true,
    });
  });
});

describe("addBrevoContact", () => {
  beforeEach(() => {
    vi.stubEnv("BREVO_API_KEY", "test-key");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("lähettää kontaktin Brevoon API-avaimella", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    await expect(addBrevoContact("a@b.fi", "25", fetchImpl)).resolves.toBe(true);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/contacts");
    expect(init.headers["api-key"]).toBe("test-key");
    expect(JSON.parse(init.body)).toEqual({ email: "a@b.fi", listIds: [25], updateEnabled: true });
  });

  it("ohittaa synkan ilman listan ID:tä", async () => {
    const fetchImpl = vi.fn();
    await expect(addBrevoContact("a@b.fi", undefined, fetchImpl)).resolves.toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("ohittaa synkan ilman API-avainta", async () => {
    vi.stubEnv("BREVO_API_KEY", "");
    const fetchImpl = vi.fn();
    await expect(addBrevoContact("a@b.fi", "25", fetchImpl)).resolves.toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("palauttaa false virhevastauksella", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("bad", { status: 400 }));
    await expect(addBrevoContact("a@b.fi", "25", fetchImpl)).resolves.toBe(false);
  });

  it("palauttaa false verkkovirheellä", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(addBrevoContact("a@b.fi", "25", fetchImpl)).resolves.toBe(false);
  });
});
