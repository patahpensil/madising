/**
 * Evaluate normalized, server-loaded clinical evidence only.
 * This is not an authorization endpoint or a clinical decision.
 * A transactional caller must reload and lock the relevant records,
 * recheck release gates and prevent duplicate execution before any write.
 * All timestamps are integer Unix milliseconds; validity is [from, until).
 */
export function evaluateNursingProcedureEvidence(evidence, now) {
  const deny = (reason) => ({ eligible: false, reason });
  const identifier = (value) => typeof value === 'string' && value.length <= 128 && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value);
  const validTime = (value) => Number.isSafeInteger(value) && value >= 0;
  const current = (record) => record != null &&
    validTime(record.validFrom) && validTime(record.validUntil) &&
    record.validFrom <= now && now < record.validUntil;
  if (!validTime(now) || !evidence || typeof evidence !== 'object') return deny('INVALID_EVIDENCE');
  const { encounter, nurse, policy, privilege, consent, order, doctor, mandate } = evidence;
  if (evidence.clinicalReleaseApproved !== true) return deny('RELEASE_NOT_APPROVED');
  if (!encounter || encounter.state !== 'ACTIVE' ||
      !identifier(encounter.id) || !identifier(encounter.patientId) ||
      !identifier(encounter.assignedNurseId) || !identifier(encounter.procedureId)) return deny('INVALID_ENCOUNTER');
  if (!nurse || !identifier(nurse.id) || nurse.id !== encounter.assignedNurseId ||
      nurse.kind !== 'CLINICIAN' || nurse.role !== 'NRS' || nurse.accountState !== 'ACTIVE' ||
      nurse.bindingState !== 'ACTIVE' || nurse.credentialState !== 'VERIFIED' ||
      !current(nurse)) return deny('NURSE_NOT_ELIGIBLE');
  if (!policy || !identifier(policy.id) || !identifier(policy.version) ||
      policy.procedureId !== encounter.procedureId || policy.state !== 'ACTIVE' ||
      policy.approvalState !== 'APPROVED' || !current(policy)) return deny('POLICY_NOT_ELIGIBLE');
  if (!['NURSING_INDEPENDENT', 'ORDER_REQUIRED', 'MANDATE_REQUIRED'].includes(policy.classification)) return deny('PROCEDURE_NOT_PERMITTED');
  if (!privilege || privilege.nurseId !== nurse.id || privilege.policyId !== policy.id ||
      privilege.policyVersion !== policy.version || privilege.state !== 'APPROVED' ||
      !current(privilege)) return deny('PRIVILEGE_NOT_ELIGIBLE');
  if (!consent || consent.encounterId !== encounter.id || consent.patientId !== encounter.patientId ||
      consent.procedureId !== encounter.procedureId || consent.policyId !== policy.id ||
      consent.policyVersion !== policy.version || consent.state !== 'ACCEPTED' ||
      !current(consent)) return deny('CONSENT_NOT_VALID');
  if (evidence.conditionsSatisfied !== true) return deny('CONDITIONS_NOT_SATISFIED');
  if (policy.classification === 'NURSING_INDEPENDENT') return { eligible: true, reason: 'INDEPENDENT_EVIDENCE_VALID' };
  if (!order || !identifier(order.id) || !identifier(order.version) || !identifier(order.issuerId) ||
      order.encounterId !== encounter.id || order.patientId !== encounter.patientId ||
      order.procedureId !== encounter.procedureId || order.policyId !== policy.id ||
      order.policyVersion !== policy.version || order.recipientId !== nurse.id ||
      order.state !== 'ACKNOWLEDGED' || order.signatureState !== 'VERIFIED' ||
      !current(order)) return deny('ORDER_NOT_VALID');
  if (!doctor || doctor.id !== order.issuerId ||
      doctor.kind !== 'CLINICIAN' || doctor.role !== 'DOC' ||
      doctor.accountState !== 'ACTIVE' || doctor.bindingState !== 'ACTIVE' ||
      doctor.credentialState !== 'VERIFIED' || doctor.encounterId !== encounter.id ||
      doctor.policyId !== policy.id || doctor.policyVersion !== policy.version ||
      doctor.authorityState !== 'VERIFIED' || !current(doctor)) return deny('DOCTOR_NOT_ELIGIBLE');
  if (policy.classification === 'ORDER_REQUIRED') return { eligible: true, reason: 'ORDER_EVIDENCE_VALID' };
  if (!mandate || !identifier(mandate.id) || mandate.type !== 'MANDATE' ||
      mandate.orderId !== order.id || mandate.orderVersion !== order.version ||
      mandate.encounterId !== encounter.id || mandate.patientId !== encounter.patientId ||
      mandate.procedureId !== encounter.procedureId || mandate.policyId !== policy.id ||
      mandate.policyVersion !== policy.version || mandate.issuerId !== doctor.id ||
      mandate.recipientId !== nurse.id || mandate.state !== 'ACKNOWLEDGED' ||
      mandate.signatureState !== 'VERIFIED' || mandate.supervisionState !== 'AVAILABLE' ||
      !current(mandate)) return deny('MANDATE_NOT_VALID');
  return { eligible: true, reason: 'MANDATE_EVIDENCE_VALID' };
}
