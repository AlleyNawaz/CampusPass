# State-machine baseline

Owner: principal architect. These are target domain transitions; Sprint 0 implements only the bold trust-critical subset described in the delivery status.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> PENDING_APPROVAL
  PENDING_APPROVAL --> APPROVED
  PENDING_APPROVAL --> DRAFT: rejected with rationale
  APPROVED --> PUBLISHED
  PUBLISHED --> LIVE
  LIVE --> COMPLETED
  COMPLETED --> ARCHIVED
  DRAFT --> CANCELLED
  PENDING_APPROVAL --> CANCELLED
  APPROVED --> CANCELLED
  PUBLISHED --> CANCELLED
  LIVE --> CANCELLED
```

```mermaid
stateDiagram-v2
  [*] --> CREATED
  CREATED --> PAYMENT_PENDING: paid flow only
  CREATED --> CONFIRMED: zero-value registration
  PAYMENT_PENDING --> PAID: authoritative provider event
  PAID --> FULFILLED: exactly-once fulfillment
  CREATED --> EXPIRED
  PAYMENT_PENDING --> FAILED
  PAYMENT_PENDING --> EXPIRED
  CONFIRMED --> CANCELLED
  FULFILLED --> PARTIALLY_REFUNDED
  FULFILLED --> REFUNDED
```

```mermaid
stateDiagram-v2
  [*] --> ACTIVE: issued
  ACTIVE --> CHECKED_IN: atomic online admission
  ACTIVE --> TRANSFERRED_OUT
  ACTIVE --> REFUNDED
  ACTIVE --> REVOKED
  ACTIVE --> EXPIRED
```

Holds, refunds, transfers, and waitlists remain planned. Their transition rules must be finalized before their migrations are introduced; no future state is marked implemented by this document.
