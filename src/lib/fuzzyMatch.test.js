import { describe, expect, it } from "vitest";
import { CONFIDENCE_THRESHOLD, findBestOptionMatch } from "./fuzzyMatch";

describe("findBestOptionMatch", () => {
  it("retorna la opcion exacta con score 1", () => {
    const result = findBestOptionMatch("Sí", ["Sí", "No"]);
    expect(result.option).toBe("Sí");
    expect(result.score).toBe(1);
  });

  it("ignora mayusculas y acentos", () => {
    const result = findBestOptionMatch("SI", ["Sí", "No"]);
    expect(result.option).toBe("Sí");
    expect(result.score).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("empareja por inclusion (transcripcion mas larga que la opcion)", () => {
    const result = findBestOptionMatch(
      "creo que excelente",
      ["Excelente", "Bueno", "Regular"]
    );
    expect(result.option).toBe("Excelente");
    expect(result.score).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("devuelve la opcion mas similar aunque no coincida", () => {
    const result = findBestOptionMatch("rejular", ["Excelente", "Bueno", "Regular"]);
    expect(result.option).toBe("Regular");
  });

  it("score bajo cuando no hay similitud razonable", () => {
    const result = findBestOptionMatch("xyz", ["Excelente", "Bueno", "Regular"]);
    expect(result.score).toBeLessThan(CONFIDENCE_THRESHOLD);
  });

  it("maneja entrada vacia o lista vacia", () => {
    expect(findBestOptionMatch("", ["Sí"])).toEqual({ option: null, score: 0 });
    expect(findBestOptionMatch("hola", [])).toEqual({ option: null, score: 0 });
  });
});
