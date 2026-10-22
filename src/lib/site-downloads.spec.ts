import { describe, expect, it } from "vitest";
import {
  downloadFileName,
  downloadPath,
  formatFileSize,
  isSiteDownloadPath,
  publicDownloadHref,
  safeFileName,
} from "./site-downloads";

describe("safeFileName", () => {
  it("poistaa ääkköset ja erikoismerkit", () => {
    expect(safeFileName("Hinnasto 2026 – ääkköset (v2).pdf")).toBe("Hinnasto-2026-aakkoset-v2.pdf");
    expect(safeFileName("../../etc/passwd")).toBe("etc-passwd");
    expect(safeFileName("###")).toBe("tiedosto");
  });
});

describe("downloadPath ja isSiteDownloadPath", () => {
  const path = downloadPath("org", "site", "gated", "Opas.pdf", "abc");

  it("tekee polun organisaation ja sivuston alle", () => {
    expect(path).toBe("org/site/gated/abc-Opas.pdf");
    expect(isSiteDownloadPath(path, "org", "site", "gated")).toBe(true);
  });

  it("hylkää toisen sivuston, tyypin ja polkutemput", () => {
    expect(isSiteDownloadPath(path, "org", "toinen", "gated")).toBe(false);
    expect(isSiteDownloadPath(path, "org", "site", "public")).toBe(false);
    expect(isSiteDownloadPath("org/site/gated/../../x/y.pdf", "org", "site", "gated")).toBe(false);
    expect(isSiteDownloadPath("org/site/gated/a/b.pdf", "org", "site", "gated")).toBe(false);
    expect(isSiteDownloadPath("org/site/gated/", "org", "site", "gated")).toBe(false);
  });
});

describe("publicDownloadHref", () => {
  it("koodaa parametrit", () => {
    expect(publicDownloadHref("s1", "o/s1/public/a b.pdf")).toBe(
      "/api/download?s=s1&f=o%2Fs1%2Fpublic%2Fa+b.pdf",
    );
  });
});

describe("formatFileSize", () => {
  it("näyttää kilotavut ja megatavut", () => {
    expect(formatFileSize(500)).toBe("1 kt");
    expect(formatFileSize(300 * 1024)).toBe("300 kt");
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2,5 Mt");
  });
});

describe("downloadFileName", () => {
  it("poistaa yksilöivän etuliitteen", () => {
    expect(downloadFileName("org/site/gated/abcDEF12_x-Opas-2026.pdf")).toBe("Opas-2026.pdf");
  });
});
