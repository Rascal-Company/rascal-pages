import { describe, expect, it } from "vitest";
import { describeProfileData } from "./overlay-profile";

const ICP = {
  value: "Suora selitys ilman jargonia.",
  audiences: "1) Pk-omistajat, 2) markkinointivastaavat",
  common_problem: "Kukaan ei näytä konkreettisesti.",
  paying_audience: "Pk-omistaja, joka haluaa säästää aikaa.",
};

describe("describeProfileData", () => {
  it("muotoilee ihanneasiakkaan otsikoiduiksi kappaleiksi", () => {
    expect(describeProfileData(ICP)).toBe(
      [
        "Mitä asiakkaat arvostavat:\nSuora selitys ilman jargonia.",
        "Kohderyhmät:\n1) Pk-omistajat, 2) markkinointivastaavat",
        "Yleisin ongelma:\nKukaan ei näytä konkreettisesti.",
        "Tärkein maksava asiakas:\nPk-omistaja, joka haluaa säästää aikaa.",
      ].join("\n\n"),
    );
  });

  it("jäsentää JSON-merkkijonon", () => {
    expect(describeProfileData(JSON.stringify(ICP))).toBe(describeProfileData(ICP));
  });

  it("muotoilee listat, tuntemattomat avaimet ja ohittaa tyhjät", () => {
    expect(describeProfileData({ pain_points: ["Hidas", "Kallis"], empty: "", x: null })).toBe(
      "Pain points:\n• Hidas\n• Kallis",
    );
  });

  it("palauttaa tavallisen tekstin sellaisenaan", () => {
    expect(describeProfileData("  Pk-yrittäjät  ")).toBe("Pk-yrittäjät");
    expect(describeProfileData(null)).toBe("");
    expect(describeProfileData({})).toBe("");
  });
});
