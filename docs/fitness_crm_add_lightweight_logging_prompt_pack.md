# FitFlow: Add Lightweight Logging & Audit Trail

FitFlow is already implemented and deployed. **Do not rebuild, refactor, or replace the existing architecture.**

First inspect the current codebase and understand how the existing authentication, MongoDB models, API routes/server actions, payments, memberships, leads, and UI are implemented.

Your task is ONLY to add a lightweight logging and audit trail to the existing application.

## 1. Technical Error Logging

Add a simple centralized server-side logger using the existing stack.

It should support:

- info
- warn
- error

Use it for important operations and unexpected errors, especially:

- payment creation/update/void
- membership creation/update/renewal
- lead conversion
- database errors
- authentication errors
- unexpected API/server errors

Do not log:

- passwords
- AUTH_SECRET
- MONGODB_URI
- session tokens
- cookies
- API keys
- unnecessary personal information

When an unexpected error occurs, show the user the existing application's normal friendly error UI/message. Do not expose stack traces or raw MongoDB errors.

If practical with the existing architecture, include a simple request/error ID so a technical error can be traced in logs.

Do not introduce an external logging service at this stage.

---

## 2. Audit Log

Add an `AuditLog` MongoDB collection/model.

Keep it simple:

```text
actorUserId
action
entityType
entityId
metadata
createdAt
```

Use the existing authenticated user as `actorUserId`.

Create audit entries for important actions:

```text
LEAD_CREATED
LEAD_UPDATED
LEAD_STATUS_CHANGED
LEAD_CONVERTED

MEMBERSHIP_CREATED
MEMBERSHIP_UPDATED
MEMBERSHIP_RENEWED
MEMBERSHIP_STATUS_CHANGED

PAYMENT_CREATED
PAYMENT_UPDATED
PAYMENT_VOIDED

COACHING_CLIENT_CREATED
WORKOUT_ASSIGNED
WORKOUT_UPDATED
DIET_PLAN_CREATED
DIET_PLAN_UPDATED
CHECKIN_CREATED
```

Only add events that make sense for functionality that already exists in FitFlow.

Do NOT redesign existing models unnecessarily.

---

## 3. Keep Metadata Simple

Do not over-engineer the metadata structure.

Use a flexible MongoDB object containing only useful information.

For example, when a payment is updated:

```json
{
  "changes": {
    "amount": {
      "from": 5000,
      "to": 3000
    },
    "paymentMethod": {
      "from": "cash",
      "to": "upi"
    }
  },
  "reason": "Incorrect amount entered"
}
```

For creation:

```json
{
  "amount": 3000,
  "paymentMethod": "upi"
}
```

Do not store complete database documents inside audit logs.

Do not store passwords, tokens, secrets, or unnecessary personal information.

---

## 4. Payments Are the Most Important

Review the existing payment implementation carefully.

For every payment:

### Create

```text
Create payment
    ↓
Create PAYMENT_CREATED audit record
```

### Update

```text
Update payment
    ↓
Create PAYMENT_UPDATED audit record
```

The update audit should record the important changed fields.

### Delete

If the current application has payment deletion, change this to a **void/archive approach** if it can be done safely without breaking the existing application.

Do not silently destroy historical payment information.

A voided payment should remain visible as voided.

Create:

```text
PAYMENT_VOIDED
```

with the actor, timestamp and optional reason.

Do not add a complicated accounting system.

---

## 5. Memberships

Add audit records for:

- membership created
- membership edited
- membership renewed
- important status changes

Do not destroy existing renewal history.

If the current implementation already stores renewal history, integrate the audit trail with it rather than replacing it.

---

## 6. Simple Audit Log UI

Add a simple authenticated page such as:

```text
/settings/audit-logs
```

or whatever route structure already exists in FitFlow.

Do not redesign navigation unnecessarily.

Show recent events:

```text
PAYMENT_CREATED

Rahul
₹3,000 • UPI

By Owner
04 Sep 2026, 08:43
```

And:

```text
PAYMENT_UPDATED

Rahul

₹5,000 → ₹3,000

By Owner
04 Sep 2026, 08:51
```

Add only simple useful filters:

- action
- entity type
- date

Keep the UI mobile-first and consistent with the existing FitFlow design.

---

## 7. Important: Don't Break Existing Functionality

Before making changes:

- inspect the existing code
- identify the existing payment model and payment CRUD
- identify membership CRUD
- identify lead conversion
- identify authentication
- identify the existing UI patterns

Then make the smallest clean changes necessary.

Do NOT:

- change the database technology
- change authentication
- change the frontend framework
- redesign the application
- introduce Redis
- introduce Kafka
- introduce external logging infrastructure
- introduce microservices
- add Phase 3 functionality

---

## 8. Testing

After implementation, test the actual existing flows.

At minimum:

### Payment

- Create payment → audit record created
- Edit payment → audit record created
- Verify changed values are captured
- Void/delete payment → historical information remains
- Invalid payment → normal error handling
- Unexpected error → technical log created

### Membership

- Create membership → audit
- Edit membership → audit
- Renew membership → audit
- Status change → audit

### Leads

- Create lead → audit
- Change status → audit
- Convert lead → audit

### Security

Verify:
- audit page requires authentication
- public lead form cannot access audit logs
- secrets are never logged
- raw database errors are not exposed

---

## 9. Final Verification

Run:

- lint
- TypeScript checks
- existing tests
- production build

Then manually verify the main payment and membership flows if the environment allows it.

Do not claim something is working unless you actually verified it.

At the end, give me a short report containing:

1. Files/components/models changed
2. What logging was added
3. What audit events were added
4. Where audit logs are stored
5. How I can access the audit-log page
6. Any issues found
7. Test/build results

Keep this implementation **simple and maintainable**. The goal is to give me visibility when something goes wrong, especially with payments, not to build an enterprise observability platform.