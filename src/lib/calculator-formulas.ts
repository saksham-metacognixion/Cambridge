/*
 * Health calculator formulas (bug 014), ported 1:1 from the live site's calculator scripts
 * (cambridgehospital.com/wp-content/code-snippets/18467.js BMI, 18532.js stroke risk, 18519.js heart health age,
 * 18507.js lung health; read 6 Oct 2026). Pure functions, no DOM, no imports: used by the client island
 * (src/scripts/calculator.ts) and by the tests (tests/calculators.test.mjs). Results carry category KEYS; the page's content
 * JSON turns them into text.
 *
 * One deliberate difference: the live stroke script falls back to the LAST risk value of its table (88 % men / 84 % women)
 * for any score outside the table, so a score of 0 (young, low blood pressure, no risk factors) showed "88 %". Here a score
 * below the table clamps to its first entry and a score above it to its last (docs/open-decisions.md CA2).
 */
export type CalculatorKey = "bmi" | "stroke-risk" | "heart-age" | "lung-health";
export type Sex = "male" | "female";

export interface CalcResult {
  /** the number shown after the result title: "22.9", "11%", "52", "6" */
  value: string;
  /** category key of the calculator's content JSON (`result.categories`) */
  category: string;
  /** stroke / lung: the points total */
  score?: number;
}

/* ───────── BMI ───────── */
export function bmi(unit: string, weight: number, height: number) {
  if (!(weight > 0) || !(height > 0)) return null;
  let v: number;
  if (unit === "metric") {
    const m = height / 100;
    v = weight / (m * m);
  } else if (unit === "imperial") {
    v = (weight * 703) / (height * height);
  } else return null;
  v = Math.round(v * 10) / 10;
  const category = v < 18.5 ? "underweight" : v < 25 ? "normal" : v < 30 ? "overweight" : "obese";
  return { bmi: v, category };
}

/* ───────── Stroke risk (Framingham-style points, as on the live site) ───────── */
/** points = number of limits the value exceeds: v <= limits[0] -> 0, v <= limits[1] -> 1, ..., above all -> limits.length */
const points = (v: number, limits: number[]) => {
  let p = 0;
  for (const l of limits) {
    if (v <= l) return p;
    p++;
  }
  return p;
};
const AGE_LIMITS: Record<Sex, number[]> = {
  male: [56, 59, 62, 65, 68, 72, 75, 78, 81, 84],
  female: [56, 59, 62, 64, 67, 70, 73, 76, 78, 81],
};
const SBP_LIMITS: Record<Sex, { off: number[]; on: number[] }> = {
  male: { off: [105, 115, 125, 135, 145, 155, 165, 175, 185, 195], on: [105, 112, 117, 123, 129, 135, 142, 150, 161, 176] },
  female: { off: [94, 106, 118, 130, 143, 155, 167, 180, 192, 204], on: [94, 106, 113, 119, 125, 131, 139, 148, 160, 204] },
};
/** 10-year risk in % by score; index 0 = score 1 */
const RISK: Record<Sex, number[]> = {
  male: [3, 3, 4, 4, 5, 5, 6, 7, 8, 10, 11, 13, 15, 17, 20, 22, 26, 29, 33, 37, 42, 47, 52, 57, 63, 68, 74, 79, 84, 88],
  female: [1, 1, 2, 2, 2, 3, 4, 4, 5, 6, 8, 9, 11, 13, 16, 19, 23, 27, 32, 37, 43, 50, 57, 64, 71, 78, 84],
};
const EXTRA: Record<Sex, { diabetes: number; smoker: number; heartDisease: number; af: number }> = {
  male: { diabetes: 2, smoker: 3, heartDisease: 4, af: 4 },
  female: { diabetes: 3, smoker: 3, heartDisease: 2, af: 6 },
};
export interface StrokeInput {
  sex: string;
  age: number;
  sbp: number;
  bpMeds: boolean;
  diabetes: boolean;
  smoker: boolean;
  heartDisease: boolean;
  af: boolean;
}
export function strokeRisk(i: StrokeInput) {
  if (i.sex !== "male" && i.sex !== "female") return null;
  if (!(i.age > 0) || !(i.sbp > 0)) return null;
  const sex: Sex = i.sex;
  const e = EXTRA[sex];
  const score =
    points(i.age, AGE_LIMITS[sex]) +
    points(i.sbp, SBP_LIMITS[sex][i.bpMeds ? "on" : "off"]) +
    (i.diabetes ? e.diabetes : 0) +
    (i.smoker ? e.smoker : 0) +
    (i.heartDisease ? e.heartDisease : 0) +
    (i.af ? e.af : 0);
  const table = RISK[sex];
  const risk = table[Math.min(Math.max(score, 1), table.length) - 1];
  return { score, risk, category: risk <= 10 ? "lower" : "elevated" };
}

/* ───────── Heart health age (Framingham heart age regression, as on the live site) ───────── */
export interface HeartAgeInput {
  sex: string;
  age: number;
  totalChol: number;
  hdl: number;
  sbp: number;
  bpMeds: boolean;
  /** 0 / 1 */
  smoker: number;
  /** 0 / 1 */
  diabetic: number;
}
export function heartAge(i: HeartAgeInput) {
  if (i.sex !== "male" && i.sex !== "female") return null;
  if (!(i.age > 0) || !(i.totalChol > 0) || !(i.hdl > 0) || !(i.sbp > 0)) return null;
  const m = i.sex === "male";
  const ageCoef = m ? 3.06117 : 2.32888;
  const sbpCoef = m ? (i.bpMeds ? 1.99881 : 1.93303) : i.bpMeds ? 2.82263 : 2.76157;
  const sum =
    ageCoef * Math.log(i.age) +
    (m ? 1.1237 : 1.20904) * Math.log(i.totalChol) -
    (m ? 0.93263 : 0.70833) * Math.log(i.hdl) +
    sbpCoef * Math.log(i.sbp) +
    (m ? 0.65451 : 0.52873) * i.smoker +
    (m ? 0.57367 : 0.69154) * i.diabetic -
    (m ? 11.6182 : 16.9162);
  const age = Math.round(Math.exp(sum / ageCoef));
  const category = age < i.age - 1 ? "younger" : age > i.age + 1 ? "older" : "similar";
  return { heartAge: age, category };
}

/* ───────── Lung health (COPD screening score, as on the live site) ───────── */
export function lungHealth(answers: number[]) {
  if (answers.length !== 5 || answers.some((v) => !Number.isInteger(v))) return null;
  const score = answers.reduce((a, b) => a + b, 0);
  return { score, category: score <= 4 ? "lower" : "copd" };
}

/* ───────── One entry point for the page: raw form values (strings) in, result out (null = invalid / missing) ───────── */
export function calculate(key: CalculatorKey, v: Record<string, string>): CalcResult | null {
  const num = (k: string) => parseFloat(v[k] ?? "");
  const int = (k: string) => parseInt(v[k] ?? "", 10);
  const yes = (k: string) => {
    const x = int(k);
    return Number.isNaN(x) ? null : x === 1;
  };
  switch (key) {
    case "bmi": {
      const r = bmi(v.unit ?? "", num("weight"), num("height"));
      return r && { value: String(r.bmi), category: r.category };
    }
    case "stroke-risk": {
      const f = { bpMeds: yes("bp_meds"), diabetes: yes("diabetes"), smoker: yes("smoker"), heartDisease: yes("heart_disease"), af: yes("af") };
      if (Object.values(f).some((x) => x === null)) return null;
      const r = strokeRisk({ sex: v.sex ?? "", age: num("age"), sbp: num("sbp"), ...(f as Record<keyof typeof f, boolean>) });
      return r && { value: `${r.risk}%`, category: r.category, score: r.score };
    }
    case "heart-age": {
      const bpMeds = yes("bp_meds");
      const smoker = int("smoker");
      const diabetic = int("diabetic");
      if (bpMeds === null || Number.isNaN(smoker) || Number.isNaN(diabetic)) return null;
      const r = heartAge({ sex: v.sex ?? "", age: num("age"), totalChol: num("total_chol"), hdl: num("hdl"), sbp: num("sbp"), bpMeds, smoker, diabetic });
      return r && { value: String(r.heartAge), category: r.category };
    }
    case "lung-health": {
      const r = lungHealth(["q1", "q2", "q3", "q4", "q5"].map(int));
      return r && { value: String(r.score), category: r.category, score: r.score };
    }
  }
}
