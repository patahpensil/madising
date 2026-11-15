import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateNursingProcedureEvidence } from '../src/clinical-authority.mjs';

function fixture(classification = 'NURSING_INDEPENDENT') {
  const window = { validFrom: 1000, validUntil: 3000 };
  return {
    clinicalReleaseApproved: true,
    conditionsSatisfied: true,
    encounter: { id: 'visit-1', patientId: 'patient-1', procedureId: 'procedure-1', assignedNurseId: 'nurse-1', state: 'ACTIVE' },
    nurse: { id: 'nurse-1', kind: 'CLINICIAN', role: 'NRS', accountState: 'ACTIVE', bindingState: 'ACTIVE', credentialState: 'VERIFIED', ...window },
    policy: { id: 'policy-1', version: 'v2', procedureId: 'procedure-1', state: 'ACTIVE', approvalState: 'APPROVED', classification, ...window },
    privilege: { nurseId: 'nurse-1', policyId: 'policy-1', policyVersion: 'v2', state: 'APPROVED', ...window },
    consent: { encounterId: 'visit-1', patientId: 'patient-1', procedureId: 'procedure-1', policyId: 'policy-1', policyVersion: 'v2', state: 'ACCEPTED', ...window },
    order: classification === 'NURSING_INDEPENDENT' ? null : { id: 'order-1', version: 'v3', issuerId: 'doctor-1', recipientId: 'nurse-1', encounterId: 'visit-1', patientId: 'patient-1', procedureId: 'procedure-1', policyId: 'policy-1', policyVersion: 'v2', state: 'ACKNOWLEDGED', signatureState: 'VERIFIED', ...window },
    doctor: { id: 'doctor-1', kind: 'CLINICIAN', role: 'DOC', accountState: 'ACTIVE', bindingState: 'ACTIVE', credentialState: 'VERIFIED', encounterId: 'visit-1', policyId: 'policy-1', policyVersion: 'v2', authorityState: 'VERIFIED', ...window },
    mandate: classification === 'MANDATE_REQUIRED' ? { id: 'mandate-1', type: 'MANDATE', orderId: 'order-1', orderVersion: 'v3', encounterId: 'visit-1', patientId: 'patient-1', procedureId: 'procedure-1', policyId: 'policy-1', policyVersion: 'v2', issuerId: 'doctor-1', recipientId: 'nurse-1', state: 'ACKNOWLEDGED', signatureState: 'VERIFIED', supervisionState: 'AVAILABLE', ...window } : null
  };
}

function applyChanges(evidence, changes) {
  for (const [key, value] of Object.entries(changes)) {
    evidence[key] = value !== null && typeof value === 'object'
      ? { ...evidence[key], ...value } : value;
  }
  return evidence;
}

const cases = [
  [
    "independent home visit without a medical order",
    "NURSING_INDEPENDENT",
    {},
    2000,
    true,
    "INDEPENDENT_EVIDENCE_VALID"
  ],
  [
    "post-discharge care with valid order",
    "ORDER_REQUIRED",
    {},
    2000,
    true,
    "ORDER_EVIDENCE_VALID"
  ],
  [
    "supervised procedure with valid mandate",
    "MANDATE_REQUIRED",
    {},
    2000,
    true,
    "MANDATE_EVIDENCE_VALID"
  ],
  [
    "production policy not approved",
    "NURSING_INDEPENDENT",
    {
      "clinicalReleaseApproved": false
    },
    2000,
    false,
    "RELEASE_NOT_APPROVED"
  ],
  [
    "missing release evidence",
    "NURSING_INDEPENDENT",
    {
      "clinicalReleaseApproved": null
    },
    2000,
    false,
    "RELEASE_NOT_APPROVED"
  ],
  [
    "missing encounter",
    "NURSING_INDEPENDENT",
    {
      "encounter": null
    },
    2000,
    false,
    "INVALID_ENCOUNTER"
  ],
  [
    "closed encounter",
    "NURSING_INDEPENDENT",
    {
      "encounter": {
        "state": "CLOSED"
      }
    },
    2000,
    false,
    "INVALID_ENCOUNTER"
  ],
  [
    "missing patient identifier",
    "NURSING_INDEPENDENT",
    {
      "encounter": {
        "patientId": ""
      }
    },
    2000,
    false,
    "INVALID_ENCOUNTER"
  ],
  [
    "another nurse assignment",
    "NURSING_INDEPENDENT",
    {
      "nurse": {
        "id": "nurse-2"
      }
    },
    2000,
    false,
    "NURSE_NOT_ELIGIBLE"
  ],
  [
    "admin account",
    "NURSING_INDEPENDENT",
    {
      "nurse": {
        "role": "ADM",
        "kind": "INTERNAL"
      }
    },
    2000,
    false,
    "NURSE_NOT_ELIGIBLE"
  ],
  [
    "suspended nurse",
    "NURSING_INDEPENDENT",
    {
      "nurse": {
        "accountState": "SUSPENDED"
      }
    },
    2000,
    false,
    "NURSE_NOT_ELIGIBLE"
  ],
  [
    "expired nurse credential at exact boundary",
    "NURSING_INDEPENDENT",
    {
      "nurse": {
        "validUntil": 2000
      }
    },
    2000,
    false,
    "NURSE_NOT_ELIGIBLE"
  ],
  [
    "future credential",
    "NURSING_INDEPENDENT",
    {
      "nurse": {
        "validFrom": 2001
      }
    },
    2000,
    false,
    "NURSE_NOT_ELIGIBLE"
  ],
  [
    "missing policy",
    "NURSING_INDEPENDENT",
    {
      "policy": null
    },
    2000,
    false,
    "POLICY_NOT_ELIGIBLE"
  ],
  [
    "unapproved policy",
    "NURSING_INDEPENDENT",
    {
      "policy": {
        "approvalState": "PENDING"
      }
    },
    2000,
    false,
    "POLICY_NOT_ELIGIBLE"
  ],
  [
    "doctor-only procedure",
    "MEDICAL_DOCTOR_ONLY",
    {},
    2000,
    false,
    "PROCEDURE_NOT_PERMITTED"
  ],
  [
    "unclassified procedure",
    "UNCLASSIFIED",
    {},
    2000,
    false,
    "PROCEDURE_NOT_PERMITTED"
  ],
  [
    "other profession procedure",
    "OTHER_PROFESSION",
    {},
    2000,
    false,
    "PROCEDURE_NOT_PERMITTED"
  ],
  [
    "delegation classification prohibited",
    "DELEGATION_REQUIRED",
    {},
    2000,
    false,
    "PROCEDURE_NOT_PERMITTED"
  ],
  [
    "policy version changed after privilege approved",
    "NURSING_INDEPENDENT",
    {
      "policy": {
        "version": "v3"
      }
    },
    2000,
    false,
    "PRIVILEGE_NOT_ELIGIBLE"
  ],
  [
    "privilege belongs to another nurse",
    "NURSING_INDEPENDENT",
    {
      "privilege": {
        "nurseId": "nurse-2"
      }
    },
    2000,
    false,
    "PRIVILEGE_NOT_ELIGIBLE"
  ],
  [
    "consent revoked",
    "NURSING_INDEPENDENT",
    {
      "consent": {
        "state": "REVOKED"
      }
    },
    2000,
    false,
    "CONSENT_NOT_VALID"
  ],
  [
    "consent for another patient",
    "NURSING_INDEPENDENT",
    {
      "consent": {
        "patientId": "patient-2"
      }
    },
    2000,
    false,
    "CONSENT_NOT_VALID"
  ],
  [
    "consent for wrong procedure",
    "NURSING_INDEPENDENT",
    {
      "consent": {
        "procedureId": "procedure-2"
      }
    },
    2000,
    false,
    "CONSENT_NOT_VALID"
  ],
  [
    "conditions not met",
    "NURSING_INDEPENDENT",
    {
      "conditionsSatisfied": false
    },
    2000,
    false,
    "CONDITIONS_NOT_SATISFIED"
  ],
  [
    "required order missing",
    "ORDER_REQUIRED",
    {
      "order": null
    },
    2000,
    false,
    "ORDER_NOT_VALID"
  ],
  [
    "unacknowledged order",
    "ORDER_REQUIRED",
    {
      "order": {
        "state": "SIGNED"
      }
    },
    2000,
    false,
    "ORDER_NOT_VALID"
  ],
  [
    "cancelled order",
    "ORDER_REQUIRED",
    {
      "order": {
        "state": "CANCELLED"
      }
    },
    2000,
    false,
    "ORDER_NOT_VALID"
  ],
  [
    "superseded order",
    "ORDER_REQUIRED",
    {
      "order": {
        "state": "SUPERSEDED"
      }
    },
    2000,
    false,
    "ORDER_NOT_VALID"
  ],
  [
    "order expired",
    "ORDER_REQUIRED",
    {
      "order": {
        "validUntil": 2000
      }
    },
    2000,
    false,
    "ORDER_NOT_VALID"
  ],
  [
    "order wrong recipient",
    "ORDER_REQUIRED",
    {
      "order": {
        "recipientId": "nurse-2"
      }
    },
    2000,
    false,
    "ORDER_NOT_VALID"
  ],
  [
    "order wrong encounter",
    "ORDER_REQUIRED",
    {
      "order": {
        "encounterId": "visit-2"
      }
    },
    2000,
    false,
    "ORDER_NOT_VALID"
  ],
  [
    "order invalid signature",
    "ORDER_REQUIRED",
    {
      "order": {
        "signatureState": "UNVERIFIED"
      }
    },
    2000,
    false,
    "ORDER_NOT_VALID"
  ],
  [
    "doctor revoked before action",
    "ORDER_REQUIRED",
    {
      "doctor": {
        "bindingState": "REVOKED"
      }
    },
    2000,
    false,
    "DOCTOR_NOT_ELIGIBLE"
  ],
  [
    "doctor unrelated to case",
    "ORDER_REQUIRED",
    {
      "doctor": {
        "encounterId": "visit-2"
      }
    },
    2000,
    false,
    "DOCTOR_NOT_ELIGIBLE"
  ],
  [
    "doctor lacks authority for this policy",
    "ORDER_REQUIRED",
    {
      "doctor": {
        "policyVersion": "v1"
      }
    },
    2000,
    false,
    "DOCTOR_NOT_ELIGIBLE"
  ],
  [
    "mandate missing",
    "MANDATE_REQUIRED",
    {
      "mandate": null
    },
    2000,
    false,
    "MANDATE_NOT_VALID"
  ],
  [
    "mandate supervision unavailable",
    "MANDATE_REQUIRED",
    {
      "mandate": {
        "supervisionState": "UNAVAILABLE"
      }
    },
    2000,
    false,
    "MANDATE_NOT_VALID"
  ],
  [
    "delegation submitted instead of mandate",
    "MANDATE_REQUIRED",
    {
      "mandate": {
        "type": "DELEGATION"
      }
    },
    2000,
    false,
    "MANDATE_NOT_VALID"
  ],
  [
    "mandate references old order version",
    "MANDATE_REQUIRED",
    {
      "mandate": {
        "orderVersion": "v2"
      }
    },
    2000,
    false,
    "MANDATE_NOT_VALID"
  ],
  [
    "mandate wrong patient",
    "MANDATE_REQUIRED",
    {
      "mandate": {
        "patientId": "patient-2"
      }
    },
    2000,
    false,
    "MANDATE_NOT_VALID"
  ],
  [
    "mandate expiry boundary",
    "MANDATE_REQUIRED",
    {
      "mandate": {
        "validUntil": 2000
      }
    },
    2000,
    false,
    "MANDATE_NOT_VALID"
  ],
  [
    "invalid clock",
    "NURSING_INDEPENDENT",
    {},
    -1,
    false,
    "INVALID_EVIDENCE"
  ],
  [
    "validity begins at exact boundary",
    "NURSING_INDEPENDENT",
    {},
    1000,
    true,
    "INDEPENDENT_EVIDENCE_VALID"
  ]
];

for (const [name, classification, changes, now, eligible, reason] of cases) {
  test(name, () => {
    const evidence = applyChanges(fixture(classification), changes);
    const before = JSON.stringify(evidence);
    assert.deepEqual(evaluateNursingProcedureEvidence(evidence, now), { eligible, reason });
    assert.equal(JSON.stringify(evidence), before);
  });
}
