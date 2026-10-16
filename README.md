# HomeReady Pro · scenario studio

[Open the studio](https://ashwin-iyer1.github.io/homereadypro/)

An independent educational home-financing calculator, rebuilt from the HackUTD project by **Dhyan, Ashwin and Spandan**. No lender, mortgage-program or CFPB affiliation is implied. The name is preserved from that team project.

## Use it

Enter a home price, down payment, fixed interest rate, term, taxes, insurance, HOA dues, monthly mortgage insurance, gross income and other debt. The studio shows an itemized monthly estimate, debt-to-income and loan-to-price ratios, a simple upfront-cash estimate, and a month-by-month amortization schedule. Optional extra principal changes payoff time and modeled interest. Save up to three scenarios in the current tab, import/export validated scenario JSON, or export the monthly schedule as CSV.

The initial numbers are fictional examples. Inputs never go to an API, analytics service or browser storage. Reload clears edits and comparison slots. Exported files contain the values you entered; keep them on a trusted device. Invalid inputs hide the estimate immediately. This app does **not** determine loan eligibility, issue approvals or make borrowing recommendations.

## Model and limits

For monthly rate `r`, term `n` months and principal `P`, the scheduled principal-and-interest payment is `P*r / (1-(1+r)^(-n))`. The zero-rate case is `P/n`; a full-cash purchase has no amortization schedule. A numerically stable formulation also handles very small rates. Each month charges interest on the remaining balance, applies scheduled and extra principal, and caps the final payment at the amount owed.

Taxes, insurance, HOA dues and entered mortgage insurance are held constant. The model excludes future changes, loan fees/points, lender credits, deposits, escrow reserves, tax effects, maintenance, prepayment penalties and loan-program rules. Interest rate is not APR. Upfront cash is simply down payment plus entered closing costs. Lender rounding and actual cash-to-close can differ. A chart/table makes the assumptions inspectable; no unexplained approval score remains.

Reference definitions: [CFPB Loan Estimate](https://www.consumerfinance.gov/owning-a-home/loan-estimate/), [debt-to-income](https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/), [rate versus APR](https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-mortgage-interest-rate-and-an-apr-en-135/).

## Develop

Node 22.12+: `cd HackUTD`, `npm ci`, `npm run dev`. Run `npm test` for independent payment checks, numeric validation, amortization invariants and bounded import tests. Install Chromium with `npx playwright install chromium`, then run `npm run test:ui` for production-built desktop/mobile workflows, comparison, export/import, invalidation and no-network/no-storage checks. `npm run build` produces the portable `HackUTD/dist/` static site. CI runs tests before Pages deployment.

The original `src/backend/csvjson.json` remains historical source material with unverified provenance; it is not imported or published in the build. The original README's team credit is preserved. Removed client-side chat/approval code included embedded API credentials. Those literals are absent from current source and build; repository history is not rewritten. The owner should revoke any still-active historical credentials with the provider. They were not tested or used during this review.
