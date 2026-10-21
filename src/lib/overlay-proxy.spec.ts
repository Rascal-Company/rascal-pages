import { describe, expect, it } from "vitest";
import { isPrivateAddress, proxyCsp, rewriteProxiedHtml } from "./overlay-proxy";

describe("isPrivateAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "ei-ip",
  ])("%s on estetty", (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "172.32.0.1", "2a00:1450:4010::200e"])(
    "%s on julkinen",
    (ip) => {
      expect(isPrivateAddress(ip)).toBe(false);
    },
  );
});

describe("rewriteProxiedHtml", () => {
  const script = "https://app.rascalpages.fi/overlay/o.js";

  it("poistaa skriptit ja lisää base-tagin ja overlay-skriptin headin alkuun", () => {
    const html = `<html><head lang="fi"><base href="/x/"><script>alert(1)</script><script src="a.js"></script></head><body><h1>Hei</h1><SCRIPT type="module">x</SCRIPT></body></html>`;
    const out = rewriteProxiedHtml(html, "https://asiakas.fi/", script);

    expect(out).not.toMatch(/alert|a\.js|type="module"/);
    expect(out).not.toContain('href="/x/"');
    expect(out).toContain(
      `<head lang="fi"><base href="https://asiakas.fi/"><script src="${script}" data-rp-preview></script>`,
    );
    expect(out).toContain("<h1>Hei</h1>");
  });

  it("poistaa CSP- ja refresh-metat", () => {
    const html = `<head><meta http-equiv="Content-Security-Policy" content="x"><meta http-equiv=refresh content="0;url=/"><meta charset="utf-8"></head>`;
    const out = rewriteProxiedHtml(html, "https://asiakas.fi/", script);
    expect(out).not.toMatch(/Content-Security-Policy|refresh/i);
    expect(out).toContain('<meta charset="utf-8">');
  });

  it("toimii ilman head-tagia ja escapettaa base-URL:n", () => {
    const out = rewriteProxiedHtml("<p>x</p>", 'https://a.fi/"><x', script);
    expect(out.startsWith('<base href="https://a.fi/&quot;>&lt;x">')).toBe(true);
  });
});

describe("proxyCsp", () => {
  it("sallii skriptit vain sovelluksen originista", () => {
    expect(proxyCsp("https://app.rascalpages.fi")).toContain(
      "script-src https://app.rascalpages.fi;",
    );
  });
});
