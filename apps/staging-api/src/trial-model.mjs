export function initialTrial() {
  return {version:0, status:'DRAFT', scenario:'INDEPENDENT', offer:null, assigned:null, declined:[], available:true, order:'NONE', assessed:false, planned:false, performed:false, evaluated:false, prescription:'NONE', delivery:'NONE', records:[]};
}
export function advanceTrial(state, role, action, expectedVersion) {
  const reject = (reason) => ({ok:false,reason,state});
  if (!state || typeof state !== 'object' || !Number.isSafeInteger(expectedVersion) || expectedVersion !== state.version) return reject('STALE');
  if (!['PAT','NRS','DOC','PHA','CUR','ADM'].includes(role)) return reject('ROLE');
  const next = {...state};
  const is = (allowedRole, status) => role === allowedRole && state.status === status;
  const findOffer = () => ['NURSE_B','NURSE_C'].find(id => !next.declined.includes(id)) ?? null;
  const setOffer = () => { next.offer = next.available ? findOffer() : null; next.status = next.offer ? 'CONFIRMED' : 'RESCHEDULE_REQUESTED'; };
  switch (action) {
    case 'INDEPENDENT': case 'MANDATE': case 'EMERGENCY': case 'OUTSIDE': case 'NO_CAPACITY':
      if (!is('PAT','DRAFT')) return reject('STATE_OR_ROLE');
      next.scenario = action; break;
    case 'REQUEST':
      if (!is('PAT','DRAFT')) return reject('STATE_OR_ROLE');
      next.status = 'REQUESTED'; break;
    case 'SCREEN':
      if (!is('PAT','REQUESTED')) return reject('STATE_OR_ROLE');
      if (state.scenario === 'EMERGENCY') next.status='ESCALATED_EMERGENCY';
      else if (state.scenario === 'OUTSIDE') next.status='REJECTED_OUT_OF_AREA';
      else next.status='TRIAGE_OK';
      break;
    case 'VERIFY_DESTINATION':
      if (!is('PAT','TRIAGE_OK')) return reject('STATE_OR_ROLE');
      next.status='LOCATION_OK'; break;
    case 'CONSENT':
      if (!is('PAT','LOCATION_OK')) return reject('STATE_OR_ROLE');
      next.status='ELIGIBILITY_CHECK'; break;
    case 'DISPATCH':
      if (!is('ADM','ELIGIBILITY_CHECK')) return reject('STATE_OR_ROLE');
      if (state.scenario === 'NO_CAPACITY') { next.available=false; next.status='RESCHEDULE_REQUESTED'; }
      else setOffer();
      break;
    case 'ACCEPT':
      if (!is('NRS','CONFIRMED') || !state.offer || state.assigned) return reject('STATE_OR_ROLE');
      next.assigned=state.offer; next.offer=null; next.status='ASSIGNED'; break;
    case 'DECLINE':
    case 'EXPIRE':
      if (!is(action==='DECLINE'?'NRS':'ADM','CONFIRMED') || !state.offer) return reject('STATE_OR_ROLE');
      next.declined=[...state.declined,state.offer]; setOffer(); break;
    case 'RESCHEDULE':
      if (!is('ADM','RESCHEDULE_REQUESTED')) return reject('STATE_OR_ROLE');
      next.scenario=state.scenario==='NO_CAPACITY'?'INDEPENDENT':state.scenario;
      next.available=true; next.declined=[]; next.status='ELIGIBILITY_CHECK'; break;
    case 'CANCEL':
      if (role!=='PAT'||!['REQUESTED','TRIAGE_OK','LOCATION_OK','ELIGIBILITY_CHECK','CONFIRMED','ASSIGNED','EN_ROUTE','RESCHEDULE_REQUESTED'].includes(state.status)) return reject('STATE_OR_ROLE');
      next.status='CANCELLED_BY_PATIENT'; next.offer=null; next.assigned=null; break;
    case 'DEPART':
      if (!is('NRS','ASSIGNED')||!state.assigned) return reject('STATE_OR_ROLE');
      next.status='EN_ROUTE'; break;
    case 'ARRIVE':
      if (!is('NRS','EN_ROUTE')) return reject('STATE_OR_ROLE');
      next.status='ARRIVED'; break;
    case 'ASSESS':
      if (!is('NRS','ARRIVED')) return reject('STATE_OR_ROLE');
      next.assessed=true; next.status='IN_PROGRESS'; break;
    case 'PLAN':
      if (!is('NRS','IN_PROGRESS')||!state.assessed||state.planned) return reject('STATE_OR_ROLE');
      next.planned=true; break;
    case 'CONSULT':
      if (!is('NRS','IN_PROGRESS')||!state.planned||state.scenario!=='MANDATE'||!['NONE','REVOKED'].includes(state.order)||state.performed) return reject('STATE_OR_ROLE');
      next.order='REQUESTED'; break;
    case 'SIGN':
      if (!is('DOC','IN_PROGRESS')||state.order!=='REQUESTED') return reject('STATE_OR_ROLE');
      next.order='SIGNED'; break;
    case 'ACKNOWLEDGE':
      if (!is('NRS','IN_PROGRESS')||state.order!=='SIGNED') return reject('STATE_OR_ROLE');
      next.order='ACKNOWLEDGED'; break;
    case 'REVOKE':
      if (!is('DOC','IN_PROGRESS')||!['SIGNED','ACKNOWLEDGED'].includes(state.order)||state.performed) return reject('STATE_OR_ROLE');
      next.order='REVOKED'; break;
    case 'PERFORM':
      if (!is('NRS','IN_PROGRESS')||!state.planned||state.performed) return reject('STATE_OR_ROLE');
      if (state.scenario==='MANDATE'&&state.order!=='ACKNOWLEDGED') return reject('ORDER_REQUIRED');
      next.performed=true; if(state.scenario==='MANDATE') next.order='EXECUTED'; break;
    case 'PRESCRIBE':
      if (!is('DOC','IN_PROGRESS')||state.scenario!=='MANDATE'||!['ACKNOWLEDGED','EXECUTED'].includes(state.order)||state.prescription!=='NONE') return reject('STATE_OR_ROLE');
      next.prescription='RECEIVED'; break;
    case 'EVALUATE':
      if (!is('NRS','IN_PROGRESS')||!state.performed||state.evaluated) return reject('STATE_OR_ROLE');
      next.evaluated=true; next.status='DOCUMENTATION_PENDING'; break;
    case 'RECONCILE':
      if (!is('NRS','DOCUMENTATION_PENDING')||!state.evaluated) return reject('STATE_OR_ROLE');
      next.status='COMPLETED'; break;
    case 'PHARMACY_ACCEPT':
      if (role!=='PHA'||state.prescription!=='RECEIVED') return reject('STATE_OR_ROLE');
      next.prescription='ACCEPTED'; break;
    case 'PHARMACY_REJECT':
      if (role!=='PHA'||state.prescription!=='RECEIVED') return reject('STATE_OR_ROLE');
      next.prescription='REJECTED'; break;
    case 'PHARMACY_READY':
      if (role!=='PHA'||state.prescription!=='ACCEPTED') return reject('STATE_OR_ROLE');
      next.prescription='READY'; next.delivery='PENDING'; break;
    case 'COURIER_ASSIGN':
      if (role!=='ADM'||state.delivery!=='PENDING'||state.prescription!=='READY') return reject('STATE_OR_ROLE');
      next.delivery='ASSIGNED'; break;
    case 'PICKUP':
      if (role!=='CUR'||state.delivery!=='ASSIGNED'||state.prescription!=='READY') return reject('STATE_OR_ROLE');
      next.delivery='PICKED_UP'; next.prescription='HANDED_OFF'; break;
    case 'DELIVER':
      if (role!=='CUR'||state.delivery!=='PICKED_UP') return reject('STATE_OR_ROLE');
      next.delivery='DELIVERED'; break;
    default: return reject('UNKNOWN_ACTION');
  }
  next.version=state.version+1;
  next.records=[...state.records,{version:next.version,role,action,status:next.status}].slice(-50);
  return {ok:true,reason:'OK',state:next};
}

export function createTrialState() {
  return { ...initialTrial(), billing: 'NOT_ISSUED' };
}
export function applyTrialAction(state, role, action, version) {
  if (!state || !Number.isSafeInteger(version) || version !== state.version) return { ok: false, reason: 'STALE', state };
  if (action === 'ISSUE_INVOICE' || action === 'SETTLE_INVOICE') {
    const eligible = state.status === 'COMPLETED' &&
      ((role === 'ADM' && action === 'ISSUE_INVOICE' && state.billing === 'NOT_ISSUED') ||
       (role === 'ADM' && action === 'SETTLE_INVOICE' && state.billing === 'ISSUED'));
    if (!eligible) return { ok:false, reason:'STATE_OR_ROLE', state };
    const next = { ...state, billing: action === 'ISSUE_INVOICE' ? 'ISSUED' : 'SETTLED', version: version + 1 };
    next.records = [...state.records, { version:next.version, role, action, status:next.status }].slice(-50);
    return { ok:true, reason:'OK', state:next };
  }
  return advanceTrial(state, role, action, version);
}
