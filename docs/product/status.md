# Delivery status

| Area                    | State                             | Evidence / limitation                                                            |
| ----------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| Discovery artifacts     | Implemented                       | Assumptions, decisions, roadmap, risks in `docs/`                                |
| Repository bootstrap    | Implemented                       | Workspaces, tasks, local environment, CI workflow                                |
| Public web shell        | Implemented; build tested         | Responsive routes `/` and `/events`; local browser binding was denied by sandbox |
| Database design         | Implemented; DB execution pending | Valid Prisma schema, SQL migration, seed, constraints, and rollback procedure    |
| Free ticket domain      | Implemented; policy tested        | Deterministic race kernel plus unverified PostgreSQL transaction service         |
| Online admission domain | Implemented; policy tested        | Conditional update/unique admission; database integration evidence pending       |
| Authentication          | Mocked only for local development | Explicit synthetic headers; rejected in production                               |
| Email/SMS/push          | Planned/disabled                  | No provider calls or success claims                                              |
| Payments/ledger         | Blocked/disabled                  | Legal/provider/MoR decisions required                                            |
| Offline scanning        | Planned/disabled                  | Cannot guarantee global single-use across disconnected devices                   |
| Deployment              | Not performed                     | Local-only per authorization boundary                                            |

Exact evidence and limitations are recorded in `docs/verification/sprint-0.md`.
