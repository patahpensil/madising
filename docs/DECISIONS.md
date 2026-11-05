# MADISING — Locked Product Decisions

Source of truth for implementation intent: **PRD V1.3.6**, agreed by the project owner. The complete master PRD must be added through a reviewed PR; this document is a concise implementation index.

## SIX-DASHBOARD-LOCK

Six operational experiences with server-enforced authorization: **Patient, Nurse, Doctor, Pharmacy, Courier, and Admin/Owner**. Never grant access by frontend route selection alone.

## ACCOUNT-LOCK

- Patients and couriers: self-registration is allowed, with verification.
- Courier registration **does not** grant permission to accept deliveries; Admin approval is required first.
- Nurse, doctor, pharmacy: **no public signup**. Accounts provisioned by Admin following relevant verification and approval.
- Owner may also act as Admin with distinct audited authority contexts.

## STAFF-LOCK

Owner selects/recruits staff. Credential verification (STR/SIP, qualifications, clinical scope) precedes Admin account activation. Dispatch must enforce active eligibility and qualification.

## SIDRAP-LOCK

Pilot homecare service area: **Kabupaten Sidenreng Rappang (Sidrap)** only, based on **visit destination**, not the requesting user's device location. Its 11 districts are Maritengngae, Panca Rijang, Baranti, Kulo, Watang Pulu, Panca Lautang, Tellu Limpoe, Watang Sidenreng, Dua Pitue, Pitu Riawa, and Pitu Riase. Production location checks require authoritative polygons and backend validation, never dropdown-only acceptance.

## GOVERNANCE-LOCK / VENDOR-MAINTENANCE

**Patah Pensil** is the technical vendor. Developer identity is separate from Admin operations. Vendor maintenance capabilities are mandatory (monitoring, bugfix, controlled deployment, backup and recovery, integrations, security response, offboarding) but do not imply routine access to clinical data. Temporary privileged production access must be authorized, time-limited, monitored and audited.

## Clinical integrity

Doctors own medical diagnoses and valid prescriptions. Nurses assess and execute within their legal/clinical scope. Pharmacists validate dispensing; couriers receive minimum delivery information. Existing RME is the authoritative medical record system until explicit integration design proves otherwise.

## Scope and financing

Pilot target: AI-assisted implementation with budget ceilings under evaluation (Rp30 million build, Rp5 million/month IT). Cost ceilings never override clinical safety and mandatory production security controls.
