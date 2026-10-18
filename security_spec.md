# Security Specification (`security_spec.md`) — OshudhBazar & PharmaPOS BD

## 1. Data Invariants

1. **Default-Deny Catch-All**: Any path not explicitly matched in `/databases/{database}/documents` is unconditionally denied (`allow read, write: if false;`).
2. **Strict Tenant & PII Ownership (`ownerId`)**: Every document across `/shops/{shopId}`, `/inventory/{itemId}`, `/customers/{customerId}`, `/transactions/{transactionId}`, `/staff/{staffId}`, `/custom_medicines/{medId}`, `/price_watches/{watchId}`, and `/price_alerts/{alertId}` must contain an `ownerId` string matching `request.auth.uid` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
3. **Verified Email Requirement**: Every write (`create`, `update`, `delete`) requires `request.auth != null && request.auth.token.email_verified == true`.
4. **Path Variable Hardening**: Every single-document target operation (`get`, `create`, `update`, `delete`) enforces `isValidId(docId)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
5. **Strict Key & Type Blueprints (`isValid[Entity]`)**: Every `create` and `update` call invokes `isValid[Entity](incoming())` checking `keys().hasAll(...)`, `keys().hasOnly(...)`, string length bounds, numeric bounds, and enum values.
6. **Temporal & Identity Immutability**:
   - On `create`: `incoming().createdAt == request.time && incoming().updatedAt == request.time`.
   - On `update`: `incoming().ownerId == existing().ownerId && incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time`, combined with action-specific `incoming().diff(existing()).affectedKeys().hasOnly(...)`.
7. **Secure List Queries (Query Enforcer)**: Every `allow list` rule explicitly enforces `isSignedIn() && resource.data.ownerId == request.auth.uid` without any `get()` or `exists()` calls inside `list`.

---

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing on Create**: Authenticated user `user_A` attempts to create `/customers/cust_1` with `ownerId: "user_B"`. -> `PERMISSION_DENIED`
2. **Unverified Email Write**: Authenticated user `user_A` with `email_verified: false` attempts to create `/inventory/item_1`. -> `PERMISSION_DENIED`
3. **Shadow Field Injection on Create**: User sends a valid `/inventory/item_1` payload plus extra ghost field `"isAdmin": true`. -> `PERMISSION_DENIED`
4. **Shadow Field Injection on Update**: User updates `/customers/cust_1` with an undeclared field `"creditLimit": 999999`. -> `PERMISSION_DENIED`
5. **Owner Hijack on Update**: User attempts to update `ownerId` on `/shops/shop_1` from `"user_A"` to `"user_B"`. -> `PERMISSION_DENIED`
6. **Immortal `createdAt` Tampering**: User attempts to modify `createdAt` during an `update` on `/inventory/item_1`. -> `PERMISSION_DENIED`
7. **Forged Client Timestamp**: User sends a past or future `createdAt` or `updatedAt` timestamp instead of `request.time`. -> `PERMISSION_DENIED`
8. **Cross-Tenant PII Read (`get`)**: User `user_B` attempts `getDoc` on `/customers/cust_owned_by_A`. -> `PERMISSION_DENIED`
9. **Blanket Unfiltered `list` Query**: User `user_B` executes an unfiltered `getDocs(collection(db, 'customers'))` trying to scrape `user_A`'s customer PII. -> `PERMISSION_DENIED`
10. **ID Poisoning Attack**: User attempts to create `/inventory/invalid$id!with*bad*chars` or an ID exceeding 128 characters. -> `PERMISSION_DENIED`
11. **Value Poisoning / Denial of Wallet String**: User sends a 10,000-character string in `itemsSummary` (limit 600) or negative `stockQty` (`-50`). -> `PERMISSION_DENIED`
12. **Invalid Enum State Injection**: User attempts to create a `/transactions/tx_1` with `txType: "hacked_type"` or `staffRole: "superadmin"`. -> `PERMISSION_DENIED`
