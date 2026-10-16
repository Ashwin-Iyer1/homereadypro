import React, { useMemo, useState } from "react";
import {
  fields,
  example,
  validate,
  calculate,
  annualSchedule,
  parseScenario,
} from "./mortgage.js";
const money = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
const percent = (v) => `${v.toFixed(1)}%`;
const names = {
  principalInterest: "Principal & interest",
  tax: "Property tax",
  insurance: "Home insurance",
  hoa: "HOA dues",
  mortgageInsurance: "Mortgage insurance",
};
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Metric({ label, value, note }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
export default function App() {
  const [inputs, setInputs] = useState({ ...example }),
    [saved, setSaved] = useState([]),
    [notice, setNotice] = useState(""),
    [importError, setImportError] = useState("");
  const { errors } = validate(inputs),
    valid = !Object.keys(errors).length;
  const result = useMemo(
    () => (valid ? calculate(inputs) : null),
    [inputs, valid],
  );
  const annual = result ? annualSchedule(result) : [];
  const baseline = result ? calculate({ ...inputs, extra: 0 }) : null;
  const stress =
    result && Number(inputs.rate) <= 29
      ? calculate({ ...inputs, rate: Number(inputs.rate) + 1 })
      : null;
  const write = (key, value) => {
    setInputs((old) => ({ ...old, [key]: value }));
    setNotice("");
  };
  const store = () => {
    if (result && saved.length < 3) {
      setSaved((old) => [
        ...old,
        {
          id: crypto.randomUUID(),
          name: `Scenario ${old.length + 1}`,
          inputs: { ...inputs },
        },
      ]);
      setNotice("Scenario saved for comparison in this tab.");
    }
  };
  const exportPlan = () =>
    download(
      "homeready-scenario.json",
      JSON.stringify({ version: 1, inputs: validate(inputs).values }, null, 2),
      "application/json",
    );
  const importPlan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 20000)
        throw new Error("Scenario file must be smaller than 20 KB.");
      setInputs(parseScenario(await file.text()));
      setImportError("");
      setNotice("Scenario imported.");
    } catch (error) {
      setImportError(error.message);
    }
    e.target.value = "";
  };
  return (
    <>
      <a href="#studio" className="skip">
        Skip to calculator
      </a>
      <header>
        <a href="#" className="brand">
          <span aria-hidden="true">⌂</span> HomeReady<span>Pro</span>
        </a>
        <nav aria-label="Main">
          <a href="#compare">Compare</a>
          <a href="#method">How it works</a>
          <a
            href="https://github.com/Ashwin-Iyer1/homereadypro"
            target="_blank"
            rel="noreferrer"
          >
            Source ↗
          </a>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">A CLEARER PICTURE OF HOME FINANCING</p>
            <h1>
              Make room
              <br />
              for <em>what if.</em>
            </h1>
            <p>
              Explore the monthly cost of a home. Adjust the assumptions,
              compare scenarios, and see where the money goes.
            </p>
          </div>
          <aside>
            <span className="pill">LOCAL SCENARIO STUDIO</span>
            <h2>
              Your numbers.
              <br />A transparent model.
            </h2>
            <p>
              Start with fictional example values. Calculations stay in this
              tab; nothing is sent to an API or saved automatically.
            </p>
            <p className="small">
              Educational estimates, not a loan offer or approval. No lender or
              housing-program affiliation.
            </p>
          </aside>
        </section>
        <section id="studio" className="studio">
          <div className="inputs panel">
            <div className="section-head">
              <h2>Build a scenario</h2>
              <button
                onClick={() => {
                  setInputs({ ...example });
                  setImportError("");
                  setNotice("Fictional example restored.");
                }}
              >
                Reset example
              </button>
            </div>
            <p className="small">
              USD · fixed rate · monthly payments. Blank or invalid inputs pause
              the estimate.
            </p>
            <div className="fields">
              {fields.map(([key, label, , min, max, unit]) => (
                <label key={key} htmlFor={key}>
                  <span>
                    {label}
                    <small>{unit}</small>
                  </span>
                  <input
                    id={key}
                    name={key}
                    type="number"
                    min={min}
                    max={max}
                    step={key === "years" ? 1 : "any"}
                    value={inputs[key]}
                    onChange={(e) => write(key, e.target.value)}
                    aria-invalid={Boolean(errors[key])}
                    aria-describedby={errors[key] ? `${key}-error` : undefined}
                  />
                  {errors[key] && (
                    <small className="error" id={`${key}-error`}>
                      {errors[key]}
                    </small>
                  )}
                </label>
              ))}
            </div>
            <p className="small">
              Mortgage insurance is a manual assumption, held constant in this
              model. A low down payment may require it; enter an estimate from a
              lender rather than treating zero as a quote.
            </p>
            <div className="actions">
              <button disabled={!valid} onClick={exportPlan}>
                Export scenario
              </button>
              <label className="file-button">
                Import scenario
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={importPlan}
                />
              </label>
            </div>
            {importError && (
              <p role="alert" className="error">
                {importError}
              </p>
            )}
          </div>
          <div className="results" aria-live="polite">
            {result ? (
              <>
                <section className="total-card">
                  <p className="eyebrow">ESTIMATED MONTHLY HOUSING COST</p>
                  <h2 data-testid="monthly">
                    {money(result.housing)}
                    <small>/ month</small>
                  </h2>
                  <p>
                    Before extra principal, utilities, maintenance and living
                    costs.
                  </p>
                  <div className="cost-bar" aria-hidden="true">
                    {Object.entries(result.costs).map(([key, value], i) => (
                      <span
                        key={key}
                        style={{
                          width: `${result.housing ? (100 * value) / result.housing : 0}%`,
                          background: `var(--cost-${i})`,
                        }}
                      />
                    ))}
                  </div>
                  <dl className="breakdown">
                    {Object.entries(result.costs).map(([key, value], i) => (
                      <div key={key}>
                        <dt>
                          <i style={{ background: `var(--cost-${i})` }} />
                          {names[key]}
                        </dt>
                        <dd>{money(value)}</dd>
                      </div>
                    ))}
                  </dl>
                  {Number(inputs.extra) > 0 && (
                    <p className="extra">
                      Planned outflow including extra principal:{" "}
                      <strong>{money(result.plannedMonthly)}/mo</strong>. Final
                      payoff month may be smaller.
                    </p>
                  )}
                </section>
                <section className="metrics">
                  <Metric
                    label="Loan amount"
                    value={money(result.principal)}
                    note={`${percent(result.ltv)} of the entered home price`}
                  />
                  <Metric
                    label="Debt-to-income"
                    value={percent(result.dti)}
                    note="Housing + other debt ÷ gross income"
                  />
                  <Metric
                    label="Housing-to-income"
                    value={percent(result.frontDti)}
                    note="Housing cost ÷ gross monthly income"
                  />
                  <Metric
                    label="Upfront cash estimate"
                    value={money(result.cash)}
                    note="Down payment + entered closing costs"
                  />
                </section>
                <section className="panel sensitivity">
                  <p className="eyebrow">CHANGE ONE ASSUMPTION</p>
                  <h2>Put the plan under pressure.</h2>
                  <div>
                    <span>Interest rate +1 percentage point</span>
                    <strong>
                      {stress
                        ? `${money(stress.housing - result.housing)} more / mo`
                        : "Enter a rate of 29% or less to compare"}
                    </strong>
                  </div>
                  <div>
                    <span>Gross income falls 20%</span>
                    <strong>{percent(result.dti / 0.8)} debt-to-income</strong>
                  </div>
                  <p className="small">
                    Same home, down payment and other costs. These are
                    illustrative changes, not forecasts or underwriting
                    thresholds.
                  </p>
                  <button
                    className="primary"
                    onClick={store}
                    disabled={saved.length >= 3}
                  >
                    {saved.length >= 3
                      ? "Three comparison slots filled"
                      : "Save for comparison"}
                  </button>
                </section>
              </>
            ) : (
              <section className="panel paused">
                <h2>Estimate paused.</h2>
                <p>
                  Correct the highlighted inputs to calculate a new scenario.
                  Previous results are hidden so they cannot be mistaken for the
                  current values.
                </p>
              </section>
            )}
          </div>
        </section>
        <p role="status" className="notice">
          {notice}
        </p>
        <section id="compare" className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">SIDE BY SIDE</p>
              <h2>See the tradeoffs.</h2>
            </div>
            <span>{saved.length} / 3 saved scenarios</span>
          </div>
          {saved.length ? (
            <div className="compare-grid">
              {saved.map((item, i) => {
                const r = calculate(item.inputs);
                return (
                  <article className="panel comparison" key={item.id}>
                    <p className="eyebrow">SAVED SCENARIO {i + 1}</p>
                    <label>
                      Scenario name
                      <input
                        value={item.name}
                        maxLength={60}
                        onChange={(e) =>
                          setSaved((old) =>
                            old.map((s) =>
                              s.id === item.id
                                ? { ...s, name: e.target.value }
                                : s,
                            ),
                          )
                        }
                      />
                    </label>
                    <h3>
                      {money(r.housing)}
                      <small>/ month</small>
                    </h3>
                    <dl>
                      <div>
                        <dt>Price / down</dt>
                        <dd>
                          {money(r.price)} / {money(r.down)}
                        </dd>
                      </div>
                      <div>
                        <dt>Rate / term</dt>
                        <dd>
                          {percent(r.rate)} / {r.years} years
                        </dd>
                      </div>
                      <div>
                        <dt>Debt-to-income</dt>
                        <dd>{percent(r.dti)}</dd>
                      </div>
                      <div>
                        <dt>Upfront estimate</dt>
                        <dd>{money(r.cash)}</dd>
                      </div>
                      <div>
                        <dt>Modeled interest</dt>
                        <dd>{money(r.totalInterest)}</dd>
                      </div>
                      <div>
                        <dt>Extra principal</dt>
                        <dd>{money(r.extra)} / mo</dd>
                      </div>
                    </dl>
                    <div className="actions">
                      <button
                        onClick={() => {
                          setInputs({ ...item.inputs });
                          setNotice(`${item.name || "Scenario"} loaded.`);
                        }}
                      >
                        Load scenario {i + 1}
                      </button>
                      <button
                        aria-label={`Remove scenario ${i + 1}`}
                        onClick={() =>
                          setSaved((old) => old.filter((s) => s.id !== item.id))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty">
              <span>01 → 02 → 03</span>
              <p>
                Save a scenario above, change a few numbers, and save another.
                Compare up to three in this tab.
              </p>
            </div>
          )}
        </section>
        {result && (
          <section className="section panel amortization">
            <div className="section-head">
              <div>
                <p className="eyebrow">WHERE EACH PAYMENT GOES</p>
                <h2>The balance, over time.</h2>
              </div>
              <button
                onClick={() =>
                  download(
                    "homeready-amortization.csv",
                    "Month,Principal,Interest,Payment,Balance\n" +
                      result.schedule
                        .map((r) =>
                          [
                            r.month,
                            r.principal.toFixed(2),
                            r.interest.toFixed(2),
                            r.payment.toFixed(2),
                            r.balance.toFixed(2),
                          ].join(","),
                        )
                        .join("\n"),
                    "text/csv",
                  )
                }
              >
                Export monthly schedule
              </button>
            </div>
            <div className="metrics">
              <Metric
                label="Modeled payoff"
                value={
                  result.payoffMonths
                    ? `${Math.floor(result.payoffMonths / 12)}y ${result.payoffMonths % 12}m`
                    : "No loan"
                }
                note="Fixed rate and constant extra payment"
              />
              <Metric
                label="Total modeled interest"
                value={money(result.totalInterest)}
                note={`${money(Math.max(0, baseline.totalInterest - result.totalInterest))} less than without extra payments`}
              />
            </div>
            <svg
              viewBox="0 0 900 180"
              role="img"
              aria-label={`Loan balance starts at ${money(result.principal)} and reaches zero after ${result.payoffMonths} months`}
            >
              <line x1="0" y1="165" x2="900" y2="165" stroke="#d5ddd7" />
              <path
                d={
                  "M0 " +
                  (result.principal ? 10 : 165) +
                  " " +
                  annual
                    .map(
                      (row) =>
                        `L${(900 * row.month) / (result.years * 12)} ${165 - (155 * row.balance) / Math.max(1, result.principal)}`,
                    )
                    .join(" ")
                }
                fill="none"
                stroke="#286b55"
                strokeWidth="3"
              />
              <text x="0" y="178">
                Start
              </text>
              <text x="840" y="178">
                {result.years} years
              </text>
            </svg>
            <details>
              <summary>
                View yearly principal, interest and remaining balance
              </summary>
              <div className="table-scroll">
                <table>
                  <caption>
                    Annual totals; taxes, insurance and fees are excluded from
                    this loan schedule.
                  </caption>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Principal paid</th>
                      <th>Interest paid</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annual.map((row) => (
                      <tr key={row.year}>
                        <th>{row.year}</th>
                        <td>{money(row.principal)}</td>
                        <td>{money(row.interest)}</td>
                        <td>{money(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        )}
        <section id="method" className="section method">
          <div>
            <p className="eyebrow">UNDERSTAND THE MODEL</p>
            <h2>
              Clear assumptions.
              <br />
              Useful questions.
            </h2>
            <p>
              This studio revisits the original HackUTD project by Dhyan, Ashwin
              and Spandan. It replaces the prototype's approval label with
              inspectable calculations.
            </p>
          </div>
          <div>
            <details open>
              <summary>What is included?</summary>
              <p>
                Fixed-rate monthly amortization using the entered interest rate,
                term and price minus down payment. Housing cost includes
                principal, interest, taxes, home insurance, HOA dues and
                manually entered mortgage insurance. Optional extra principal
                reduces the modeled balance and payoff time.
              </p>
            </details>
            <details>
              <summary>What should I verify?</summary>
              <p>
                Interest rate is not APR. Fees, points, credits, deposits,
                escrow reserves, mortgage-insurance changes, maintenance and
                future tax or insurance changes are not modeled. Upfront cash is
                a simple down-payment-plus-costs estimate, not an official
                cash-to-close figure. Per-payment lender rounding can differ.
              </p>
            </details>
            <details>
              <summary>Why is there no approval score?</summary>
              <p>
                A few ratios cannot establish eligibility. This model does not
                assess credit, lender rules or a specific loan program. It makes
                no recommendation to borrow. Use lender-provided Loan Estimates
                to compare actual offers.
              </p>
            </details>
            <div className="source-links">
              <a
                href="https://www.consumerfinance.gov/owning-a-home/loan-estimate/"
                target="_blank"
                rel="noreferrer"
              >
                CFPB · Reading a Loan Estimate ↗
              </a>
              <a
                href="https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/"
                target="_blank"
                rel="noreferrer"
              >
                CFPB · Debt-to-income explained ↗
              </a>
              <a
                href="https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-mortgage-interest-rate-and-an-apr-en-135/"
                target="_blank"
                rel="noreferrer"
              >
                CFPB · Interest rate and APR ↗
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <strong>HomeReady Pro</strong>
        <p>
          Independent educational project · Original HackUTD team: Dhyan,
          Ashwin, Spandan.
        </p>
        <p>
          Inputs and saved scenarios clear on reload. Export only to a device
          you trust.
        </p>
      </footer>
    </>
  );
}
