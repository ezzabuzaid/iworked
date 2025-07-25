## Product Requirements Document

**Product:** Minimal Time‑Tracking & Invoicing API
**Audience:** Back‑end developer
**Revision:** 2025‑07‑25

---

### 1. Purpose

Freelancers like **Khaled** need a friction‑free way to log billable hours and turn them into invoices. Existing tools are bloated, UI‑heavy, or lock data behind subscriptions. We’re shipping a _headless_ JSON API that other apps (mobile, CLI, web) can sit on top of.

---

### 2. Goals & Success Metrics

| Goal                    | KPI                                                 |
| ----------------------- | --------------------------------------------------- |
| Cut Khaled’s admin time | ≤ 5 min/week spent on time + invoicing              |
| Billable leakage        | 0 unlogged hours after one month’s use              |
| Invoice accuracy        | 100 % match between logged hours and amounts billed |
| Developer adoption      | First external integrator build in < 2 days         |

---

### 3. Target Personas

| Persona                    | Core Need                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------- |
| **Khaled – Freelancer**    | Track hours per project, create professional invoices, keep history immutable.     |
| Future: **Client Finance** | Verify hours and amounts on invoices. _(Not part of MVP but must not be blocked.)_ |

---

### 4. Scope (MVP)

#### Must‑Have

1. **Clients** – create, rename, archive.
2. **Projects** – belong to a client, carry an hourly rate.
3. **Time Entries** – start time, end time, free‑text note, attached to a project.
4. **Summary Report** – grouped totals (hours, monetary amount) by client _or_ project for any date range.
5. **Invoices**
   - Draft from a date range.
   - Snapshot totals into _invoice lines_ (one line per project).
   - Status life‑cycle: `draft → sent → paid`.
   - PDF generation trigger (file stored anywhere; URL returned).

6. **Immutable History** – once a time entry is in a non‑draft invoice it can’t be edited or deleted.
7. **Single‑user Auth** – bearer token on every request.

#### Nice‑to‑Have

- Email the PDF when marking an invoice **sent**.
- Manual currency override per invoice (default USD).

#### Out‑of‑Scope (for now)

- Multi‑user workspaces, roles, OAuth.
- Online payment collection (Stripe, Wise, etc.).
- Tax/VAT calculations.
- Mobile or web UI.

---

### 5. User Flows (Happy Path)

1. **Setup** – Khaled adds ACME as a client and creates “Website Redesign” project at \$50/h.
2. **Tracking** – Each work session: “start”, “stop”; system stores entry.
3. **Review** – End of month Khaled requests _Summary_ for 1‑31 Aug grouped by project.
4. **Invoice** – Khaled hits “Create invoice” for ACME, same date range. System:
   - Creates draft with one line (“Website Redesign – 42.5 h – \$2 125”).
   - Locks the underlying time entries.

5. **Send** – Khaled presses “Send”. System generates PDF, sets status = _sent_.
6. **Payment** – When money arrives, Khaled marks invoice _paid_ with amount & date.
7. **Audit** – Any later summary still reflects raw hours; invoice amounts remain frozen.

---

### 6. Functional Requirements

| ID        | Requirement                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| **FR‑1**  | System shall allow creation, retrieval, update, archival of Clients and Projects.                                  |
| **FR‑2**  | System shall allow creation and retrieval of individual Time Entries.                                              |
| **FR‑3**  | System shall reject Time Entries where `endedAt ≤ startedAt`.                                                      |
| **FR‑4**  | System shall provide a Summary report: total hours & amount for a date range, grouped by either client or project. |
| **FR‑5**  | System shall create an Invoice draft by selecting all Time Entries for a given client within a date range.         |
| **FR‑6**  | System shall copy hours/rates into Invoice Lines at draft creation and prevent further changes to those figures.   |
| **FR‑7**  | System shall block edits or deletions to Time Entries that belong to any invoice not in _draft_ status.            |
| **FR‑8**  | System shall allow status transitions only **forward** (`draft → sent → paid`).                                    |
| **FR‑9**  | System shall record `sentAt`, `paidAt`, and `paidAmount` timestamps/values.                                        |
| **FR‑10** | System shall expose a single endpoint to download the generated PDF for an invoice.                                |

---

### 7. Business Rules

| Rule     | Description                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------- |
| **BR‑1** | Hourly rate lives on **Project**; captured in Invoice Line when invoice is drafted.            |
| **BR‑2** | Rounding: hours to 0.01 h, amounts to 0.01 currency units.                                     |
| **BR‑3** | Sequence numbers for invoices not required until tax/VAT features land.                        |
| **BR‑4** | Multiple projects for one client may share a rate or differ—system doesn’t enforce uniformity. |
| **BR‑5** | Overlapping Time Entries are allowed; the freelancer is responsible for correctness.           |

---

### 8. Non‑Functional Requirements

| Category          | Requirement                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| **Performance**   | 95 % of API calls respond in ≤ 200 ms under realistic workload.                                      |
| **Reliability**   | 99.5 % uptime monthly.                                                                               |
| **Security**      | All endpoints require HTTPS and a bearer token. No sensitive PII stored besides client names/emails. |
| **Scalability**   | Must support at least 10 000 Time Entries without performance degradation.                           |
| **Auditing**      | All state‑changing actions logged with user ID and timestamp.                                        |
| **Documentation** | Deliver OpenAPI file + brief README explaining endpoints and auth scheme.                            |
| **Testing**       | Automated tests cover functional flows and locking logic.                                            |

---

### 9. Assumptions & Dependencies

- Single‑user product for MVP; multi‑user will add roles & workspace IDs later.
- PDF generation can be off‑loaded to any service or library as long as the resulting file is accessible via public URL.
- Front‑end clients will handle their own local time conversions; API always returns UTC‑aware timestamps.

---

### 10. Open Questions

1. Do we need per‑project default currency now, or lock everything to a global default?
2. Should the API store client billing address for the PDF header?
3. How should sequence numbers for invoices be handled once tax compliance is required?

---

### 11. Acceptance Criteria (High‑Level)

- Khaled can, via API calls alone, recreate the **Happy Path** end‑to‑end within 15 minutes.
- Attempting to edit an invoiced Time Entry returns an error.
- Summary totals equal the sum of relevant Time Entries.
- Invoice totals equal the sum of their lines regardless of later Project rate changes.
- PDF link persists and is downloadable at least 30 days after generation.

---

Deliver this document; the back‑end developer owns implementation choices (frameworks, DB schema, code style) so long as every requirement above is met.
