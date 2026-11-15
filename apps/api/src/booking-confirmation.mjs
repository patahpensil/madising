/**
 * Evaluate booking-confirmation evidence loaded from trusted server records.
 * This function does not reserve capacity, assign a nurse or write a booking.
 * The caller must authenticate the requester and lock/reload the relevant
 * records in one transaction before committing CONFIRMED and its audit event.
 * Times are integer Unix milliseconds; evidence validity is [from, until).
 */
export function evaluateBookingConfirmation(evidence, now) {
  const deny = (reason) => ({ confirmed: false, reason });
  const id = (value) => typeof value === 'string' && value.length <= 128 && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value);
  const timestamp = (value) => Number.isSafeInteger(value) && value >= 0;
  const current = (record) => record && timestamp(record.validFrom) &&
    timestamp(record.validUntil) && record.validFrom <= now && now < record.validUntil;
  if (!timestamp(now) || !evidence || typeof evidence !== 'object') return deny('INVALID_EVIDENCE');
  const { booking, requester, authorization, patient, service, triage, location, consent, slot, reservation, eligibility, release } = evidence;
  if (!booking || !id(booking.id) || !id(booking.version) || !id(booking.patientId) ||
      !id(booking.requesterId) || !id(booking.serviceId) || !id(booking.serviceVersion) ||
      !id(booking.addressVersion) || !id(booking.triageVersion) || !id(booking.slotId) || !id(booking.quoteVersion) ||
      !['ELIGIBILITY_CHECK', 'ADMIN_REVIEW'].includes(booking.state)) return deny('INVALID_BOOKING');
  if (!requester || requester.id !== booking.requesterId || requester.kind !== 'PATIENT' ||
      requester.role !== 'PAT' || requester.accountState !== 'ACTIVE' ||
      requester.bindingState !== 'ACTIVE' || requester.contactVerified !== true) return deny('REQUESTER_NOT_ELIGIBLE');
  if (!patient || patient.id !== booking.patientId || patient.state !== 'VERIFIED') return deny('PATIENT_NOT_VERIFIED');
  if (!authorization || authorization.requesterId !== requester.id ||
      authorization.patientId !== patient.id || authorization.scope !== 'BOOKING' ||
      !['SELF', 'VERIFIED_REPRESENTATIVE'].includes(authorization.type) ||
      authorization.state !== 'VERIFIED' || !current(authorization)) return deny('AUTHORIZATION_NOT_VALID');
  if (!triage || triage.bookingId !== booking.id || triage.patientId !== patient.id ||
      triage.version !== booking.triageVersion || !current(triage)) return deny('TRIAGE_NOT_VALID');
  if (triage.result === 'RED_FLAG') return deny('EMERGENCY_ESCALATION_REQUIRED');
  if (triage.result !== 'CLEAR') return deny('TRIAGE_REVIEW_REQUIRED');
  if (!release || release.state !== 'APPROVED' || release.regionCode !== 'SIDRAP' ||
      !current(release)) return deny('RELEASE_NOT_APPROVED');
  if (!service || service.id !== booking.serviceId || service.version !== booking.serviceVersion ||
      service.state !== 'ACTIVE' || service.approvalState !== 'APPROVED' ||
      !current(service)) return deny('SERVICE_NOT_ACTIVE');
  const expectedRoute = service.route === 'NURSING' ? 'ELIGIBILITY_CHECK' :
    service.route === 'SPECIALIST' ? 'ADMIN_REVIEW' : null;
  if (expectedRoute !== booking.state) return deny('REVIEW_ROUTE_MISMATCH');
  if (expectedRoute === 'ADMIN_REVIEW') {
    const review = evidence.review;
    if (!review || review.bookingId !== booking.id || review.bookingVersion !== booking.version ||
        review.serviceVersion !== service.version || review.addressVersion !== booking.addressVersion ||
        review.state !== 'APPROVED' || review.scopeVerified !== true || !current(review)) {
      return deny('ADMIN_REVIEW_REQUIRED');
    }
  }
  if (!location || location.bookingId !== booking.id || location.addressVersion !== booking.addressVersion ||
      location.geofenceSource !== 'AUTHORITATIVE' || location.state !== 'VERIFIED' ||
      location.regionCode !== 'SIDRAP' || !current(location)) return deny('DESTINATION_NOT_VERIFIED');
  if (consent?.bookingId !== booking.id || consent.patientId !== patient.id ||
      consent.requesterId !== requester.id || consent.serviceVersion !== service.version ||
      consent.quoteVersion !== booking.quoteVersion || consent.scope !== 'BOOKING' ||
      consent.state !== 'ACCEPTED' || !current(consent)) return deny('BOOKING_CONSENT_NOT_VALID');
  if (!slot || slot.id !== booking.slotId || slot.serviceId !== service.id ||
      slot.serviceVersion !== service.version || slot.regionCode !== location.regionCode ||
      slot.state !== 'OPEN' || !timestamp(slot.startsAt) || !timestamp(slot.endsAt) ||
      slot.startsAt < now || slot.endsAt <= slot.startsAt) return deny('SLOT_NOT_AVAILABLE');
  if (!reservation || !id(reservation.id) || reservation.bookingId !== booking.id ||
      reservation.bookingVersion !== booking.version || reservation.slotId !== slot.id ||
      reservation.serviceVersion !== service.version || reservation.state !== 'HELD' ||
      reservation.units !== 1 || !current(reservation)) return deny('CAPACITY_NOT_RESERVED');
  if (!eligibility || eligibility.bookingId !== booking.id || eligibility.bookingVersion !== booking.version ||
      eligibility.reservationId !== reservation.id || eligibility.serviceVersion !== service.version ||
      eligibility.slotId !== slot.id || eligibility.state !== 'VERIFIED' ||
      eligibility.credentialVerified !== true || eligibility.competencyVerified !== true ||
      eligibility.coverageVerified !== true || eligibility.capacityVerified !== true ||
      !current(eligibility)) return deny('CAPACITY_NOT_ELIGIBLE');
  return { confirmed: true, reason: 'CONFIRMATION_EVIDENCE_VALID' };
}
