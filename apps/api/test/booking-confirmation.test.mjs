import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBookingConfirmation } from '../src/booking-confirmation.mjs';

function fixture(route = 'NURSING') {
  const window = { validFrom: 1000, validUntil: 3000 };
  return {
    booking: { id:'booking-1', version:'v1', requesterId:'requester-1',patientId:'patient-1',serviceId:'service-1',serviceVersion:'v2',addressVersion:'v1',triageVersion:'v1',slotId:'slot-1',quoteVersion:'v1',state:route==='NURSING'?'ELIGIBILITY_CHECK':'ADMIN_REVIEW'},
    requester:{id:'requester-1',kind:'PATIENT',role:'PAT',accountState:'ACTIVE',bindingState:'ACTIVE',contactVerified:true},
    patient:{id:'patient-1',state:'VERIFIED'},
    authorization:{requesterId:'requester-1',patientId:'patient-1',scope:'BOOKING',type:'SELF',state:'VERIFIED',...window},
    service:{id:'service-1',version:'v2',state:'ACTIVE',approvalState:'APPROVED',route,...window},
    triage:{bookingId:'booking-1',patientId:'patient-1',version:'v1',result:'CLEAR',...window},
    location:{bookingId:'booking-1',addressVersion:'v1',state:'VERIFIED',geofenceSource:'AUTHORITATIVE',regionCode:'SIDRAP',...window},
    consent:{bookingId:'booking-1',patientId:'patient-1',requesterId:'requester-1',serviceVersion:'v2',quoteVersion:'v1',scope:'BOOKING',state:'ACCEPTED',...window},
    slot:{id:'slot-1',serviceId:'service-1',serviceVersion:'v2',regionCode:'SIDRAP',state:'OPEN',startsAt:2500,endsAt:3500},
    reservation:{id:'reservation-1',bookingId:'booking-1',bookingVersion:'v1',slotId:'slot-1',serviceVersion:'v2',state:'HELD',units:1,...window},
    eligibility:{bookingId:'booking-1',bookingVersion:'v1',reservationId:'reservation-1',serviceVersion:'v2',slotId:'slot-1',state:'VERIFIED',credentialVerified:true,competencyVerified:true,coverageVerified:true,capacityVerified:true,...window},
    release:{state:'APPROVED',regionCode:'SIDRAP',...window},
    review:route==='SPECIALIST'?{bookingId:'booking-1',bookingVersion:'v1',serviceVersion:'v2',addressVersion:'v1',state:'APPROVED',scopeVerified:true,...window}:null,
  };
}

function applyChanges(evidence, changes) {
  for (const [key, value] of Object.entries(changes)) evidence[key] = value !== null &&
    typeof value === 'object' ? { ...evidence[key], ...value } : value;
  return evidence;
}

const cases = [
  [
    "home nursing visit with eligible reserved capacity",
    "NURSING",
    {},
    2000,
    true,
    "CONFIRMATION_EVIDENCE_VALID"
  ],
  [
    "family member outside pilot books verified represented patient in Sidrap",
    "NURSING",
    {
      "authorization": {
        "type": "VERIFIED_REPRESENTATIVE"
      },
      "requester": {
        "deviceRegion": "OUTSIDE_SIDRAP"
      }
    },
    2000,
    true,
    "CONFIRMATION_EVIDENCE_VALID"
  ],
  [
    "direct doctor visit after specialist review",
    "SPECIALIST",
    {},
    2000,
    true,
    "CONFIRMATION_EVIDENCE_VALID"
  ],
  [
    "payment status does not control booking while OPEN-07 remains open",
    "NURSING",
    {
      "paymentState": "UNPAID"
    },
    2000,
    true,
    "CONFIRMATION_EVIDENCE_VALID"
  ],
  [
    "invalid clock",
    "NURSING",
    {},
    -1,
    false,
    "INVALID_EVIDENCE"
  ],
  [
    "missing booking",
    "NURSING",
    {
      "booking": null
    },
    2000,
    false,
    "INVALID_BOOKING"
  ],
  [
    "missing identifier",
    "NURSING",
    {
      "booking": {
        "id": ""
      }
    },
    2000,
    false,
    "INVALID_BOOKING"
  ],
  [
    "already assigned booking cannot reconfirm",
    "NURSING",
    {
      "booking": {
        "state": "ASSIGNED"
      }
    },
    2000,
    false,
    "INVALID_BOOKING"
  ],
  [
    "requester is not verified",
    "NURSING",
    {
      "requester": {
        "contactVerified": false
      }
    },
    2000,
    false,
    "REQUESTER_NOT_ELIGIBLE"
  ],
  [
    "admin cannot use patient booking evaluator",
    "NURSING",
    {
      "requester": {
        "role": "ADM",
        "kind": "INTERNAL"
      }
    },
    2000,
    false,
    "REQUESTER_NOT_ELIGIBLE"
  ],
  [
    "patient lookup missing",
    "NURSING",
    {
      "patient": null
    },
    2000,
    false,
    "PATIENT_NOT_VERIFIED"
  ],
  [
    "patient data belongs to another person",
    "NURSING",
    {
      "patient": {
        "id": "patient-2"
      }
    },
    2000,
    false,
    "PATIENT_NOT_VERIFIED"
  ],
  [
    "representative authority revoked",
    "NURSING",
    {
      "authorization": {
        "state": "REVOKED"
      }
    },
    2000,
    false,
    "AUTHORIZATION_NOT_VALID"
  ],
  [
    "authority for another patient",
    "NURSING",
    {
      "authorization": {
        "patientId": "patient-2"
      }
    },
    2000,
    false,
    "AUTHORIZATION_NOT_VALID"
  ],
  [
    "authority expires at boundary",
    "NURSING",
    {
      "authorization": {
        "validUntil": 2000
      }
    },
    2000,
    false,
    "AUTHORIZATION_NOT_VALID"
  ],
  [
    "red flags stop routine booking",
    "NURSING",
    {
      "triage": {
        "result": "RED_FLAG"
      }
    },
    2000,
    false,
    "EMERGENCY_ESCALATION_REQUIRED"
  ],
  [
    "uncertain triage held for review",
    "NURSING",
    {
      "triage": {
        "result": "UNKNOWN"
      }
    },
    2000,
    false,
    "TRIAGE_REVIEW_REQUIRED"
  ],
  [
    "missing triage",
    "NURSING",
    {
      "triage": null
    },
    2000,
    false,
    "TRIAGE_NOT_VALID"
  ],
  [
    "stale triage version",
    "NURSING",
    {
      "triage": {
        "version": "old"
      }
    },
    2000,
    false,
    "TRIAGE_NOT_VALID"
  ],
  [
    "pilot release not approved",
    "NURSING",
    {
      "release": {
        "state": "DRAFT"
      }
    },
    2000,
    false,
    "RELEASE_NOT_APPROVED"
  ],
  [
    "inactive service",
    "NURSING",
    {
      "service": {
        "state": "SUSPENDED"
      }
    },
    2000,
    false,
    "SERVICE_NOT_ACTIVE"
  ],
  [
    "missing service approval",
    "NURSING",
    {
      "service": {
        "approvalState": "DRAFT"
      }
    },
    2000,
    false,
    "SERVICE_NOT_ACTIVE"
  ],
  [
    "service definition changed",
    "NURSING",
    {
      "service": {
        "version": "v3"
      }
    },
    2000,
    false,
    "SERVICE_NOT_ACTIVE"
  ],
  [
    "specialist routed to nursing eligibility",
    "SPECIALIST",
    {
      "booking": {
        "state": "ELIGIBILITY_CHECK"
      }
    },
    2000,
    false,
    "REVIEW_ROUTE_MISMATCH"
  ],
  [
    "unsupported route",
    "NURSING",
    {
      "service": {
        "route": "UNCLASSIFIED"
      }
    },
    2000,
    false,
    "REVIEW_ROUTE_MISMATCH"
  ],
  [
    "specialist review missing",
    "SPECIALIST",
    {
      "review": null
    },
    2000,
    false,
    "ADMIN_REVIEW_REQUIRED"
  ],
  [
    "specialist review stale booking version",
    "SPECIALIST",
    {
      "review": {
        "bookingVersion": "v0"
      }
    },
    2000,
    false,
    "ADMIN_REVIEW_REQUIRED"
  ],
  [
    "reviewer scope not verified",
    "SPECIALIST",
    {
      "review": {
        "scopeVerified": false
      }
    },
    2000,
    false,
    "ADMIN_REVIEW_REQUIRED"
  ],
  [
    "destination outside Sidrap despite requester device inside",
    "NURSING",
    {
      "location": {
        "regionCode": "OUTSIDE_SIDRAP"
      },
      "requester": {
        "deviceRegion": "SIDRAP"
      }
    },
    2000,
    false,
    "DESTINATION_NOT_VERIFIED"
  ],
  [
    "ambiguous boundary location",
    "NURSING",
    {
      "location": {
        "state": "REVIEW"
      }
    },
    2000,
    false,
    "DESTINATION_NOT_VERIFIED"
  ],
  [
    "client pin without authoritative verification",
    "NURSING",
    {
      "location": {
        "geofenceSource": "CLIENT"
      }
    },
    2000,
    false,
    "DESTINATION_NOT_VERIFIED"
  ],
  [
    "changed address version",
    "NURSING",
    {
      "location": {
        "addressVersion": "v0"
      }
    },
    2000,
    false,
    "DESTINATION_NOT_VERIFIED"
  ],
  [
    "booking consent declined",
    "NURSING",
    {
      "consent": {
        "state": "DECLINED"
      }
    },
    2000,
    false,
    "BOOKING_CONSENT_NOT_VALID"
  ],
  [
    "quote changed after consent",
    "NURSING",
    {
      "consent": {
        "quoteVersion": "v0"
      }
    },
    2000,
    false,
    "BOOKING_CONSENT_NOT_VALID"
  ],
  [
    "slot already started",
    "NURSING",
    {
      "slot": {
        "startsAt": 1999
      }
    },
    2000,
    false,
    "SLOT_NOT_AVAILABLE"
  ],
  [
    "invalid slot interval",
    "NURSING",
    {
      "slot": {
        "endsAt": 2500
      }
    },
    2000,
    false,
    "SLOT_NOT_AVAILABLE"
  ],
  [
    "closed slot",
    "NURSING",
    {
      "slot": {
        "state": "CLOSED"
      }
    },
    2000,
    false,
    "SLOT_NOT_AVAILABLE"
  ],
  [
    "no capacity held",
    "NURSING",
    {
      "reservation": null
    },
    2000,
    false,
    "CAPACITY_NOT_RESERVED"
  ],
  [
    "reservation from another booking",
    "NURSING",
    {
      "reservation": {
        "bookingId": "booking-2"
      }
    },
    2000,
    false,
    "CAPACITY_NOT_RESERVED"
  ],
  [
    "expired capacity hold",
    "NURSING",
    {
      "reservation": {
        "validUntil": 2000
      }
    },
    2000,
    false,
    "CAPACITY_NOT_RESERVED"
  ],
  [
    "released capacity hold",
    "NURSING",
    {
      "reservation": {
        "state": "RELEASED"
      }
    },
    2000,
    false,
    "CAPACITY_NOT_RESERVED"
  ],
  [
    "invalid capacity quantity",
    "NURSING",
    {
      "reservation": {
        "units": 0
      }
    },
    2000,
    false,
    "CAPACITY_NOT_RESERVED"
  ],
  [
    "stale booking version on reservation",
    "NURSING",
    {
      "booking": {
        "version": "v2"
      }
    },
    2000,
    false,
    "CAPACITY_NOT_RESERVED"
  ],
  [
    "nearest nurse lacks competency",
    "NURSING",
    {
      "eligibility": {
        "competencyVerified": false
      }
    },
    2000,
    false,
    "CAPACITY_NOT_ELIGIBLE"
  ],
  [
    "provider credential revoked",
    "NURSING",
    {
      "eligibility": {
        "credentialVerified": false
      }
    },
    2000,
    false,
    "CAPACITY_NOT_ELIGIBLE"
  ],
  [
    "coverage not verified",
    "NURSING",
    {
      "eligibility": {
        "coverageVerified": false
      }
    },
    2000,
    false,
    "CAPACITY_NOT_ELIGIBLE"
  ],
  [
    "capacity no longer eligible",
    "NURSING",
    {
      "eligibility": {
        "capacityVerified": false
      }
    },
    2000,
    false,
    "CAPACITY_NOT_ELIGIBLE"
  ],
  [
    "eligibility for different hold",
    "NURSING",
    {
      "eligibility": {
        "reservationId": "reservation-2"
      }
    },
    2000,
    false,
    "CAPACITY_NOT_ELIGIBLE"
  ],
  [
    "validity begins exactly now",
    "NURSING",
    {},
    1000,
    true,
    "CONFIRMATION_EVIDENCE_VALID"
  ],
  [
    "slot starts exactly now",
    "NURSING",
    {},
    2500,
    true,
    "CONFIRMATION_EVIDENCE_VALID"
  ]
];

for (const [name, route, changes, now, confirmed, reason] of cases) {
  test(name, () => {
    const evidence = applyChanges(fixture(route), changes);
    const before = JSON.stringify(evidence);
    assert.deepEqual(evaluateBookingConfirmation(evidence, now), { confirmed, reason });
    assert.equal(JSON.stringify(evidence), before);
  });
}
