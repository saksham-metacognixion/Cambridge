// Run: npm run test:calculators   (Node 22.18+/24+ strips the TypeScript types natively)
// Expected values = the live site's calculator scripts (code-snippets 18467 / 18532 / 18519 / 18507, read 6 Oct 2026),
// worked by hand from their tables and formulas.
import assert from 'node:assert/strict';
import { bmi, calculate, heartAge, lungHealth, strokeRisk } from '../src/lib/calculator-formulas.ts';

let failed = 0;
const test = (name, fn) => {
  try { fn(); console.log('  ok   ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
};

console.log('BMI');
test('metric: 70 kg / 175 cm = 22.9, normal', () => assert.deepEqual(bmi('metric', 70, 175), { bmi: 22.9, category: 'normal' }));
test('imperial: 154 lb / 69 in = 22.7, normal', () => assert.deepEqual(bmi('imperial', 154, 69), { bmi: 22.7, category: 'normal' }));
test('categories at the live thresholds (18.5 / 25 / 30)', () => {
  assert.equal(bmi('metric', 50, 175).category, 'underweight');
  assert.equal(bmi('metric', 56.7, 175).bmi, 18.5);
  assert.equal(bmi('metric', 56.7, 175).category, 'normal');
  assert.equal(bmi('metric', 76.6, 175).category, 'overweight');
  assert.equal(bmi('metric', 91.9, 175).category, 'obese');
});
test('missing unit, zero or negative values -> null', () => {
  assert.equal(bmi('', 70, 175), null);
  assert.equal(bmi('metric', 0, 175), null);
  assert.equal(bmi('metric', 70, -1), null);
  assert.equal(calculate('bmi', { unit: 'metric', weight: '', height: '175' }), null);
});
test('calculate() formats the value', () => assert.deepEqual(calculate('bmi', { unit: 'metric', weight: '70', height: '175' }), { value: '22.9', category: 'normal' }));

console.log('Stroke risk');
test('man 65, SBP 140, no treatment, no factors: 3 + 4 = 7 points -> 6 %, lower', () =>
  assert.deepEqual(strokeRisk({ sex: 'male', age: 65, sbp: 140, bpMeds: false, diabetes: false, smoker: false, heartDisease: false, af: false }), { score: 7, risk: 6, category: 'lower' }));
test('woman 70, SBP 160 on treatment, diabetes + AF: 5 + 8 + 3 + 6 = 22 -> 50 %, elevated', () =>
  assert.deepEqual(strokeRisk({ sex: 'female', age: 70, sbp: 160, bpMeds: true, diabetes: true, smoker: false, heartDisease: false, af: true }), { score: 22, risk: 50, category: 'elevated' }));
test('man with every factor and the top age / pressure bands: 33 points clamps to the last table value (88 %)', () =>
  assert.deepEqual(strokeRisk({ sex: 'male', age: 90, sbp: 200, bpMeds: false, diabetes: true, smoker: true, heartDisease: true, af: true }), { score: 33, risk: 88, category: 'elevated' }));
test('score 0 clamps to the first table value (3 % men, 1 % women), not the live fallback of 88 %', () => {
  assert.deepEqual(strokeRisk({ sex: 'male', age: 40, sbp: 100, bpMeds: false, diabetes: false, smoker: false, heartDisease: false, af: false }), { score: 0, risk: 3, category: 'lower' });
  assert.deepEqual(strokeRisk({ sex: 'female', age: 40, sbp: 90, bpMeds: false, diabetes: false, smoker: false, heartDisease: false, af: false }), { score: 0, risk: 1, category: 'lower' });
});
test('band edges: man 56 -> 0, 57 -> 1, 85 -> 10; SBP on treatment 176 -> 9, 177 -> 10', () => {
  const m = (age, sbp, bpMeds = false) => strokeRisk({ sex: 'male', age, sbp, bpMeds, diabetes: false, smoker: false, heartDisease: false, af: false }).score;
  assert.equal(m(56, 100), 0);
  assert.equal(m(57, 100), 1);
  assert.equal(m(85, 100), 10);
  assert.equal(m(50, 176, true), 9);
  assert.equal(m(50, 177, true), 10);
});
test('10 % is lower, 11 % is elevated (live: a numeric risk <= 10 is lower)', () => {
  const man = (extra) => strokeRisk({ sex: 'male', age: 65, sbp: 140, bpMeds: false, diabetes: false, smoker: false, heartDisease: false, af: false, ...extra });
  assert.deepEqual(man({ diabetes: true }), { score: 9, risk: 8, category: 'lower' });
  assert.deepEqual(man({ smoker: true }), { score: 10, risk: 10, category: 'lower' });
  assert.deepEqual(man({ smoker: true, diabetes: true }), { score: 12, risk: 13, category: 'elevated' });
  // woman 72 (6) + SBP 150 (5) + smoker (3) = 14 -> 13 %
  assert.deepEqual(strokeRisk({ sex: 'female', age: 72, sbp: 150, bpMeds: false, diabetes: false, smoker: true, heartDisease: false, af: false }), { score: 14, risk: 13, category: 'elevated' });
});
test('calculate(): raw form values, score in the result, missing answer -> null', () => {
  assert.deepEqual(calculate('stroke-risk', { sex: 'male', age: '65', sbp: '140', bp_meds: '0', diabetes: '0', smoker: '0', heart_disease: '0', af: '0' }), { value: '6%', category: 'lower', score: 7 });
  assert.equal(calculate('stroke-risk', { sex: 'male', age: '65', sbp: '140', bp_meds: '', diabetes: '0', smoker: '0', heart_disease: '0', af: '0' }), null);
  assert.equal(calculate('stroke-risk', { sex: '', age: '65', sbp: '140', bp_meds: '0', diabetes: '0', smoker: '0', heart_disease: '0', af: '0' }), null);
});

console.log('Heart health age');
// Reference = the live formula written out independently of the library.
const liveHeartAge = (sex, age, chol, hdl, sbp, meds, smoker, diabetic) => {
  const m = sex === 'male';
  const B = m ? (meds ? 1.99881 : 1.93303) : (meds ? 2.82263 : 2.76157);
  const s = m ? 3.06117 : 2.32888;
  return Math.round(Math.exp((s * Math.log(age) + (m ? 1.1237 : 1.20904) * Math.log(chol) - (m ? 0.93263 : 0.70833) * Math.log(hdl) + B * Math.log(sbp) + (m ? 0.65451 : 0.52873) * smoker + (m ? 0.57367 : 0.69154) * diabetic - (m ? 11.6182 : 16.9162)) / s));
};
test('man 45, cholesterol 200, HDL 50, SBP 120, no treatment, non-smoker, no diabetes: 44 (close to your age)', () => {
  assert.equal(liveHeartAge('male', 45, 200, 50, 120, false, 0, 0), 44);
  assert.deepEqual(heartAge({ sex: 'male', age: 45, totalChol: 200, hdl: 50, sbp: 120, bpMeds: false, smoker: 0, diabetic: 0 }), { heartAge: 44, category: 'similar' });
});
test('smoker with diabetes on treatment: older than the age', () => {
  const r = heartAge({ sex: 'male', age: 45, totalChol: 240, hdl: 35, sbp: 150, bpMeds: true, smoker: 1, diabetic: 1 });
  assert.equal(r.heartAge, liveHeartAge('male', 45, 240, 35, 150, true, 1, 1));
  assert.equal(r.category, 'older');
});
test('woman with low risk values: younger than the age', () => {
  const r = heartAge({ sex: 'female', age: 60, totalChol: 160, hdl: 70, sbp: 105, bpMeds: false, smoker: 0, diabetic: 0 });
  assert.equal(r.heartAge, liveHeartAge('female', 60, 160, 70, 105, false, 0, 0));
  assert.equal(r.category, 'younger');
});
test('category bands: within +/- 1 year is "close to your age"', () => {
  assert.equal(heartAge({ sex: 'male', age: 44, totalChol: 200, hdl: 50, sbp: 120, bpMeds: false, smoker: 0, diabetic: 0 }).category, 'similar'); // 44 vs 44
  assert.equal(heartAge({ sex: 'male', age: 43, totalChol: 200, hdl: 50, sbp: 120, bpMeds: false, smoker: 0, diabetic: 0 }).category, 'similar'); // 42 vs 43
});
test('calculate(): raw values; a missing or non-positive value -> null', () => {
  assert.deepEqual(calculate('heart-age', { sex: 'male', age: '45', total_chol: '200', hdl: '50', sbp: '120', bp_meds: '0', smoker: '0', diabetic: '0' }), { value: '44', category: 'similar' });
  assert.equal(calculate('heart-age', { sex: 'male', age: '45', total_chol: '0', hdl: '50', sbp: '120', bp_meds: '0', smoker: '0', diabetic: '0' }), null);
  assert.equal(calculate('heart-age', { sex: 'male', age: '45', total_chol: '200', hdl: '50', sbp: '120', bp_meds: '0', smoker: '', diabetic: '0' }), null);
});

console.log('Lung health');
test('all first answers: 0, lower risk', () => assert.deepEqual(lungHealth([0, 0, 0, 0, 0]), { score: 0, category: 'lower' }));
test('4 points is still lower risk, 5 is possible COPD', () => {
  assert.deepEqual(lungHealth([2, 2, 0, 0, 0]), { score: 4, category: 'lower' });
  assert.deepEqual(lungHealth([2, 2, 1, 0, 0]), { score: 5, category: 'copd' });
});
test('smoking counts 2 points (live option value), age 60+ counts 2', () => assert.deepEqual(lungHealth([0, 0, 0, 2, 2]), { score: 4, category: 'lower' }));
test('calculate(): a missing answer -> null, otherwise "Score: n"', () => {
  assert.equal(calculate('lung-health', { q1: '2', q2: '2', q3: '2', q4: '', q5: '2' }), null);
  assert.deepEqual(calculate('lung-health', { q1: '2', q2: '2', q3: '2', q4: '2', q5: '2' }), { value: '10', category: 'copd', score: 10 });
});

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
