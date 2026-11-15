import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrialState,applyAutomaticTrialAction,expireTrialOffer} from '../src/trial-model.mjs';
const now=1000000;
function run(events,state=createTrialState()){
 for(const [role,action] of events){const before=JSON.stringify(state);const result=applyAutomaticTrialAction(state,role,action,state.version,now);assert.equal(result.ok,true,action);assert.equal(JSON.stringify(state),before);state=result.state;}return state;
}
const booking=[['PAT','REQUEST'],['PAT','SCREEN'],['PAT','VERIFY_DESTINATION'],['PAT','CONSENT']];
test('booking automatically offers nearest eligible nurse and records system event',()=>{const state=run(booking);assert.equal(state.status,'CONFIRMED');assert.equal(state.offer,'NURSE_B');assert.equal(state.records.at(-1).role,'SYSTEM');assert.equal(state.version,5);assert.equal(applyAutomaticTrialAction(state,'ADM','DISPATCH',state.version,now).ok,false);});
test('no capacity routes to exception without inventing a nurse',()=>{const state=run([['PAT','NO_CAPACITY'],...booking]);assert.equal(state.status,'RESCHEDULE_REQUESTED');assert.equal(state.offer,null);});
test('red flags and out-of-area remain blocked',()=>{for(const scenario of ['EMERGENCY','OUTSIDE']){const state=run([['PAT',scenario],...booking.slice(0,2)]);assert.equal(state.offer,null);assert.equal(applyAutomaticTrialAction(state,'PAT','CONSENT',state.version,now).ok,false);}});
test('late duplicate consent and wrong role are rejected',()=>{const state=run(booking);assert.equal(applyAutomaticTrialAction(state,'PAT','CONSENT',3,now).ok,false);assert.equal(applyAutomaticTrialAction(state,'NRS','CONSENT',state.version,now).ok,false);});
test('decline makes one next offer and assignment is unique',()=>{const state=run([...booking,['NRS','DECLINE']]);assert.equal(state.offer,'NURSE_C');const assigned=run([['NRS','ACCEPT']],state);assert.equal(assigned.assigned,'NURSE_C');assert.equal(assigned.offer,null);assert.equal(applyAutomaticTrialAction(assigned,'NRS','ACCEPT',assigned.version,now).ok,false);});

test('expiry advances one candidate only at or after the deadline',()=>{const first=run(booking);assert.equal(expireTrialOffer(first,first.offerExpiresAt-1),first);const second=expireTrialOffer(first,first.offerExpiresAt);assert.equal(second.offer,'NURSE_C');assert.equal(second.records.at(-1).role,'SYSTEM');assert.equal(expireTrialOffer(second,second.offerExpiresAt-1),second);const exhausted=expireTrialOffer(second,second.offerExpiresAt);assert.equal(exhausted.offer,null);assert.equal(exhausted.status,'RESCHEDULE_REQUESTED');assert.equal(first.offer,'NURSE_B');});
