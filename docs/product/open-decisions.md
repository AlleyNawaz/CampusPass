# Founder decisions

## Launch blockers

1. Is there written NUST permission for a pilot and, separately, permission to use the NUST name or marks?
2. Which society, named event, and accountable contacts are authorized as design partners?
3. Which legal entity operates CampusPass, owns provider/developer accounts, and signs contracts?
4. Who is merchant of record, who issues receipts, and who bears refunds, disputes, tax, and chargebacks?
5. Which payment provider has actually approved the entity, use case, production API, settlement, and refund flow?
6. What campus verification method and minimum student data have the university and privacy reviewer authorized?

## Reversible defaults needing confirmation

7. May public events admit external guests while campus-only events require verified affiliation? Default: yes, per explicit event policy.
8. What is the first event's capacity, arrival profile, number of gates, and peak scans per second? Default test model: 500 attendees, two gates, 10 scans/sec/gate burst.
9. Is offline admission required for the pilot? Default: no; fail closed without network and maintain a documented manual contingency.
10. What monthly budget is available for hosting, email, support, security, and compliance? Default: local development only; no paid resources provisioned.

These questions do not block local Sprint 0 engineering. They block the relevant launch gates.
