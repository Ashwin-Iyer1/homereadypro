export const fields = [
  ["price", "Home price", 350000, 1, 10000000, "USD"],
  ["down", "Down payment", 70000, 0, 10000000, "USD"],
  ["rate", "Annual interest rate", 6.5, 0, 30, "%"],
  ["years", "Loan term", 30, 1, 40, "years"],
  ["tax", "Annual property tax", 4200, 0, 1000000, "USD / year"],
  ["insurance", "Annual home insurance", 1800, 0, 1000000, "USD / year"],
  ["hoa", "Monthly HOA dues", 0, 0, 100000, "USD / month"],
  ["mi", "Monthly mortgage insurance", 0, 0, 100000, "USD / month"],
  ["income", "Gross monthly income", 8000, 1, 10000000, "USD / month"],
  ["debts", "Other monthly debt payments", 500, 0, 1000000, "USD / month"],
  ["closing", "Estimated closing costs", 9000, 0, 1000000, "USD"],
  ["extra", "Extra monthly principal", 0, 0, 1000000, "USD / month"],
];
export const example = Object.fromEntries(
  fields.map(([key, , value]) => [key, value]),
);
export function validate(input) {
  const values = {},
    errors = {};
  for (const [key, label, , min, max] of fields) {
    const raw = input?.[key],
      value = Number(raw);
    if (
      raw === undefined ||
      raw === null ||
      typeof raw === "boolean" ||
      typeof raw === "object" ||
      String(raw).trim() === "" ||
      !Number.isFinite(value) ||
      value < min ||
      value > max
    )
      errors[key] =
        `${label} must be between ${min.toLocaleString()} and ${max.toLocaleString()}.`;
    else values[key] = value;
  }
  if (values.years && !Number.isInteger(values.years))
    errors.years = "Use a whole number of years.";
  if (values.down > values.price)
    errors.down = "Down payment cannot exceed the home price.";
  return { values, errors };
}
export function calculate(input) {
  const { values: v, errors } = validate(input);
  if (Object.keys(errors).length)
    throw new Error(Object.values(errors).join(" "));
  const principal = v.price - v.down,
    n = v.years * 12,
    rate = v.rate / 1200;
  const pi =
    principal === 0
      ? 0
      : rate === 0
        ? principal / n
        : (principal * rate) / -Math.expm1(-n * Math.log1p(rate));
  const costs = {
    principalInterest: pi,
    tax: v.tax / 12,
    insurance: v.insurance / 12,
    hoa: v.hoa,
    mortgageInsurance: v.mi,
  };
  const housing = Object.values(costs).reduce((a, b) => a + b, 0),
    schedule = [];
  let balance = principal,
    totalInterest = 0,
    totalPrincipal = 0;
  for (let month = 1; balance > 0.0000001 && month <= n; month++) {
    const interest = balance * rate,
      paid = Math.min(balance, Math.max(0, pi - interest) + v.extra);
    balance = Math.max(0, balance - paid);
    totalInterest += interest;
    totalPrincipal += paid;
    schedule.push({
      month,
      interest,
      principal: paid,
      payment: paid + interest,
      balance,
    });
  }
  return {
    ...v,
    principal,
    pi,
    costs,
    housing,
    plannedMonthly: housing + (principal ? v.extra : 0),
    dti: (100 * (housing + v.debts)) / v.income,
    frontDti: (100 * housing) / v.income,
    ltv: (100 * principal) / v.price,
    cash: v.down + v.closing,
    totalInterest,
    totalPrincipal,
    payoffMonths: schedule.length,
    schedule,
  };
}
export function annualSchedule(result) {
  const rows = [];
  for (let start = 0; start < result.schedule.length; start += 12) {
    const months = result.schedule.slice(start, start + 12);
    rows.push({
      year: start / 12 + 1,
      month: months.at(-1).month,
      principal: months.reduce((s, m) => s + m.principal, 0),
      interest: months.reduce((s, m) => s + m.interest, 0),
      balance: months.at(-1).balance,
    });
  }
  return rows;
}
export function parseScenario(text) {
  if (text.length > 20000)
    throw new Error("Scenario file must be smaller than 20 KB.");
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Choose a valid scenario JSON file.");
  }
  if (data?.version !== 1 || !data.inputs)
    throw new Error("Use a HomeReady Pro version 1 scenario.");
  const { values, errors } = validate(data.inputs);
  if (Object.keys(errors).length)
    throw new Error(Object.values(errors).join(" "));
  return values;
}
