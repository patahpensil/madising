import { rankCandidates, trialCandidates, trialDestination, trialPositions, distanceMeters } from './trial-geo.mjs';
export function initialTrial() {
  return {version:0, status:'DRAFT', scenario:'INDEPENDENT', offer:null, offerExpiresAt:null, assigned:null, declined:[], available:true, order:'NONE', assessed:false, planned:false, performed:false, evaluated:false, prescription:'NONE', delivery:'NONE', records:[]};
}
export function advanceTrial(state, role, action, expectedVersion, now = Date.now()) {
  const reject = (reason) => ({ok:false,reason,state});
  if (!state || typeof state !== 'object' || !Number.isSafeInteger(expectedVersion) || expectedVersion !== state.version) return reject('STALE');
  if (!['PAT','NRS','DOC','PHA','CUR','ADM'].includes(role)) return reject('ROLE');
  const next = {...state};
  const is = (allowedRole, status) => role === allowedRole && state.status === status;
  const findOffer = () => rankCandidates(trialCandidates(now),trialDestination,now,next.declined)[0]?.id ?? null;
  const setOffer = () => { next.offer = next.available ? findOffer() : null; next.offerExpiresAt=next.offer?now+120000:null; next.status = next.offer ? 'CONFIRMED' : 'RESCHEDULE_REQUESTED'; };
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
      if (!is('NRS','CONFIRMED') || !state.offer || state.assigned || !Number.isSafeInteger(state.offerExpiresAt) || now>=state.offerExpiresAt) return reject('STATE_OR_ROLE');
      next.assigned=state.offer; next.offer=null; next.offerExpiresAt=null; next.status='ASSIGNED'; break;
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
      next.status='CANCELLED_BY_PATIENT'; next.offer=null; next.offerExpiresAt=null; next.assigned=null; break;
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
  return { ...initialTrial(), billing:'NOT_ISSUED', tracking:null, consultation:{messages:[],call:'NONE',channel:null} };
}
export function applyTrialAction(state, role, action, version, now = Date.now()) {
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
  const reject = () => ({ok:false,reason:'STATE_OR_ROLE',state});
  const changed = (fields) => {
    const next={...state,...fields,version:version+1};
    next.records=[...state.records,{version:next.version,role,action,status:next.status}].slice(-50);
    return {ok:true,reason:'OK',state:next};
  };
  if(action==='LOCATION_STEP'){
    if(role!=='NRS'||state.status!=='EN_ROUTE'||!state.assigned)return reject();
    const index=(state.tracking?.index??-1)+1;
    if(index>=trialPositions.length)return reject();
    const point=trialPositions[index];
    return changed({tracking:{index,point,updatedAt:now,meters:distanceMeters(point,trialDestination),source:'SYNTHETIC'}});
  }
  if(['MESSAGE_REQUEST','MESSAGE_REPLY','REQUEST_AUDIO','REQUEST_VIDEO','ACCEPT_CALL','END_CALL'].includes(action)){
    if(!['NRS','DOC'].includes(role)||state.status!=='IN_PROGRESS'||state.order==='NONE'||!state.assigned)return reject();
    const current=state.consultation??{messages:[],call:'NONE',channel:null};
    if(action==='MESSAGE_REQUEST'||action==='MESSAGE_REPLY'){
      if((action==='MESSAGE_REQUEST'&&role!=='NRS')||(action==='MESSAGE_REPLY'&&role!=='DOC')||current.messages.length>=20)return reject();
      if(action==='MESSAGE_REPLY'&&!current.messages.some(m=>m.role==='NRS'))return reject();
      return changed({consultation:{...current,messages:[...current.messages,{role,kind:action,at:now}]}});
    }
    if(action==='REQUEST_AUDIO'||action==='REQUEST_VIDEO'){
      if(role!=='NRS'||!['NONE','ENDED'].includes(current.call))return reject();
      return changed({consultation:{...current,call:'REQUESTED',channel:action==='REQUEST_AUDIO'?'AUDIO':'VIDEO'}});
    }
    if(action==='ACCEPT_CALL'){
      if(role!=='DOC'||current.call!=='REQUESTED')return reject();
      return changed({consultation:{...current,call:'ACCEPTED_SIMULATION'}});
    }
    if(!['REQUESTED','ACCEPTED_SIMULATION'].includes(current.call))return reject();
    return changed({consultation:{...current,call:'ENDED'}});
  }
  const result=advanceTrial(state,role,action,version,now);
  if(result.ok){
    if(result.state.status!=='EN_ROUTE')result.state.tracking=null;
    if(result.state.status!=='IN_PROGRESS'&&result.state.consultation?.call!=='NONE'){
      result.state.consultation={...result.state.consultation,call:'ENDED'};
    }
  }
  return result;
}

export function projectTrialState(state,role,now=Date.now()){
  const view={version:state.version,status:state.status,scenario:state.scenario};
  if(['PAT','NRS','ADM'].includes(role))view.assigned=state.assigned;
  if(['NRS','ADM'].includes(role)){view.offer=state.offer;view.offerExpiresAt=state.offerExpiresAt;}
  if(['PAT','NRS'].includes(role)&&state.status==='EN_ROUTE'&&state.tracking){
    view.tracking={...state.tracking,stale:now-state.tracking.updatedAt>120000};
  }
  if(role==='NRS'||role==='DOC')Object.assign(view,{order:state.order,planned:state.planned,performed:state.performed,prescription:state.prescription,consultation:state.consultation});
  if(['PAT','ADM','PHA','CUR'].includes(role))Object.assign(view,{prescription:state.prescription,delivery:state.delivery});
  if(['PAT','ADM'].includes(role))view.billing=state.billing;
  return view;
}

/** Advance the synthetic booking and dispatch in the same locked store transaction. */
export function applyAutomaticTrialAction(state,role,action,version,now=Date.now()){
  const result=applyTrialAction(state,role,action,version,now);
  if(!result.ok)return result;
  if((action==='CONSENT'||action==='RESCHEDULE')&&result.state.status==='ELIGIBILITY_CHECK'){
    if(result.state.version>=1000)return {ok:false,reason:'VERSION_LIMIT',state};
    const dispatched=applyTrialAction(result.state,'ADM','DISPATCH',result.state.version,now);
    if(!dispatched.ok)return {ok:false,reason:'DISPATCH_FAILED',state};
    const records=dispatched.state.records.map(record=>record.version===dispatched.state.version?{...record,role:'SYSTEM'}:record);
    return {...dispatched,state:{...dispatched.state,records}};
  }
  return result;
}
