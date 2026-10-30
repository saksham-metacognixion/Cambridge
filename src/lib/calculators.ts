import data from "../data/calculators.json";
import type { CalculatorKey } from "./calculator-formulas";

/*
 * Health calculator pages (bug 014): templates filled from JSON. Field structure here (src/data/calculators.json), text in
 * src/data/content/calculators/<key>.<locale>.json, formulas in src/lib/calculator-formulas.ts (pure, tested), page URL =
 * PAGE_PATHS[page] (the live site's URL). Template: src/pages/[...base]/[calculator].astro.
 */
export interface CalculatorField {
  name: string;
  type: "select" | "number";
  /** select: option values (the text comes from the content JSON `fields.<name>.options`) */
  options?: string[];
  min?: number;
  step?: number;
}
export interface Calculator {
  key: CalculatorKey;
  /** key in PAGE_PATHS */
  page: string;
  fields: CalculatorField[];
}

export const calculators = data.calculators as Calculator[];
