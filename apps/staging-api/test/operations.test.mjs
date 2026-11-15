import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrialState,applyTrialAction,projectTrialState} from '../src/trial-model.mjs';
import {distanceMeters,rankCandidates,trialCandidates,trialDestination} from '../src/trial-geo.mjs';
const time=1000000;
function run(events,state=createTrialState(),now=time){
 for(const [role,action] of events){const before=JSON.stringify(state);const result=applyTrialAction(state,role,action,state.version,now);assert.equal(result.ok,true,action);assert.equal(JSON.stringify(state),before);state=result.state;}return state;
}
const dispatch=[['PAT','REQUEST'],['PAT','SCREEN'],['PAT','VERIFY_DESTINATION'],['PAT','CONSENT'],['ADM','DISPATCH']];
const travel=[...dispatch,['NRS','ACCEPT'],['NRS','DEPART']];
const visit=[...travel,['NRS','ARRIVE'],['NRS','ASSESS'],['NRS','PLAN']];
const consult=[['PAT','MANDATE'],...visit,['NRS','CONSULT']];
test('distance sanity and invalid coordinates',()=>{assert.equal(distanceMeters({lat:0,lon:0},{lat:0,lon:0}),0);assert.equal(distanceMeters({lat:91,lon:0},trialDestination),null);assert.ok(distanceMeters({lat:0,lon:0},{lat:0,lon:1})>111000);});
test('rank eligible candidates; skip nearest incompetent and stale location',()=>{assert.deepEqual(rankCandidates(trialCandidates(time),trialDestination,time).map(c=>c.id),['NURSE_B','NURSE_C']);assert.deepEqual(rankCandidates(trialCandidates(time),trialDestination,time+120001),[]);assert.deepEqual(rankCandidates(trialCandidates(time),trialDestination,time,['NURSE_B']).map(c=>c.id),['NURSE_C']);});
test('late offer acceptance fails on exact expiry',()=>{const state=run(dispatch);assert.equal(applyTrialAction(state,'NRS','ACCEPT',state.version,time+120000).ok,false);const next=run([['ADM','EXPIRE']],state,time+120000);assert.equal(next.offer,'NURSE_C');assert.equal(next.offerExpiresAt,time+240000);});
test('tracking only for journey and scoped patient or nurse; arrival clears it',()=>{const start=run(travel);assert.equal(applyTrialAction(start,'PAT','LOCATION_STEP',start.version,time).ok,false);const state=run([['NRS','LOCATION_STEP']],start);assert.equal(projectTrialState(state,'PAT',time).tracking.source,'SYNTHETIC');assert.equal(projectTrialState(state,'PAT',time+120001).tracking.stale,true);assert.equal('tracking' in projectTrialState(state,'DOC',time),false);const arrived=run([['NRS','ARRIVE']],state);assert.equal(arrived.tracking,null);assert.equal(applyTrialAction(arrived,'NRS','LOCATION_STEP',arrived.version,time).ok,false);});
test('consultation requires active encounter, scoped participants and doctor reply',()=>{const state=run(consult);assert.equal(applyTrialAction(state,'ADM','MESSAGE_REQUEST',state.version,time).ok,false);assert.equal(applyTrialAction(state,'DOC','MESSAGE_REPLY',state.version,time).ok,false);const next=run([['NRS','MESSAGE_REQUEST'],['DOC','MESSAGE_REPLY'],['NRS','REQUEST_AUDIO'],['DOC','ACCEPT_CALL'],['NRS','END_CALL'],['NRS','REQUEST_VIDEO'],['DOC','ACCEPT_CALL']],state);assert.equal(next.consultation.messages.length,2);assert.equal(next.consultation.channel,'VIDEO');assert.equal(next.consultation.call,'ACCEPTED_SIMULATION');assert.equal('consultation' in projectTrialState(next,'PAT',time),false);});
test('call ends on departure from active encounter, no provider or recording',()=>{const s=run([...consult,['NRS','REQUEST_VIDEO'],['DOC','ACCEPT_CALL'],['DOC','SIGN'],['NRS','ACKNOWLEDGE'],['NRS','PERFORM'],['NRS','EVALUATE']]);assert.equal(s.consultation.call,'ENDED');assert.equal(applyTrialAction(s,'DOC','ACCEPT_CALL',s.version,time).ok,false);});
