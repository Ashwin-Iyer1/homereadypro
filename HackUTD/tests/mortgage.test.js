import test from "node:test";
import assert from "node:assert/strict";
import {
  example,
  calculate,
  validate,
  parseScenario,
  annualSchedule,
} from "../src/mortgage.js";
test("fixed rate payment matches an independent known mortgage example", () => {
  const r = calculate({
    ...example,
    price: 100000,
    down: 0,
    rate: 6,
    years: 30,
  });
  assert.ok(Math.abs(r.pi - 599.550525) < 0.000001);
  assert.equal(r.schedule.length, 360);
  assert.ok(r.schedule.at(-1).balance < 0.000001);
  assert.ok(Math.abs(r.totalPrincipal - 100000) < 0.000001);
});
test("zero interest, zero loan, and tiny rates remain finite", () => {
  const zero = calculate({ ...example, rate: 0 });
  assert.equal(zero.pi, 280000 / 360);
  assert.equal(zero.totalInterest, 0);
  const cash = calculate({ ...example, down: 350000 });
  assert.equal(cash.pi, 0);
  assert.equal(cash.payoffMonths, 0);
  assert.equal(cash.totalPrincipal, 0);
  assert.ok(
    Math.abs(calculate({ ...example, rate: 1e-10 }).pi - zero.pi) < 0.00001,
  );
});
test("numeric strings never concatenate and total housing includes every entered cost", () => {
  const r = calculate({
    ...example,
    income: "8000",
    debts: "500",
    tax: "4200",
    insurance: "1800",
    hoa: "100",
    mi: "125",
  });
  assert.equal(r.housing, r.pi + 350 + 150 + 100 + 125);
  assert.equal(r.dti, (100 * (r.housing + 500)) / 8000);
  assert.equal(r.frontDti, (100 * r.housing) / 8000);
  assert.equal(r.ltv, 80);
  assert.equal(r.cash, 79000);
});
test("invalid and missing inputs pause calculation rather than returning NaN or stale values", () => {
  for (const input of [
    { ...example, income: 0 },
    { ...example, rate: "" },
    { ...example, price: NaN },
    { ...example, down: 400000 },
    { ...example, years: 1.5 },
    { ...example, extra: -1 },
    { ...example, price: true },
  ]) {
    assert.ok(Object.keys(validate(input).errors).length);
    assert.throws(() => calculate(input));
  }
});
test("extra payments reduce interest and payoff time, final payment is capped", () => {
  const a = calculate(example),
    b = calculate({ ...example, extra: 1000 });
  assert.ok(b.totalInterest < a.totalInterest);
  assert.ok(b.payoffMonths < a.payoffMonths);
  assert.ok(b.schedule.at(-1).payment <= b.pi + 1000);
  assert.ok(Math.abs(b.totalPrincipal - b.principal) < 0.000001);
  const yearly = annualSchedule(b);
  assert.equal(yearly.at(-1).month, b.payoffMonths);
  assert.ok(
    Math.abs(yearly.reduce((s, r) => s + r.interest, 0) - b.totalInterest) <
      0.000001,
  );
});
test("scenario import is bounded, versioned and whitelists numeric inputs", () => {
  assert.deepEqual(
    parseScenario(
      JSON.stringify({
        version: 1,
        inputs: { ...example, secret: "not part of the model" },
      }),
    ),
    example,
  );
  assert.throws(() => parseScenario("bad"));
  assert.throws(() =>
    parseScenario(JSON.stringify({ version: 2, inputs: example })),
  );
  assert.throws(() => parseScenario(" ".repeat(20001)));
  assert.throws(() =>
    parseScenario(
      JSON.stringify({ version: 1, inputs: { ...example, price: {} } }),
    ),
  );
});
