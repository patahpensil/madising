import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrialState,applyTrialAction } from '../src/trial-model.mjs';
import { TrialStore } from '../src/trial-store.mjs';
const dispatch = [['PAT','REQUEST'],['PAT','SCREEN'],['PAT','VERIFY_DESTINATION'],['PAT','CONSENT'],['ADM','DISPATCH']];
const visit = [...dispatch,['NRS','ACCEPT'],['NRS','DEPART'],['NRS','ARRIVE'],['NRS','ASSESS'],['NRS','PLAN'],['NRS','PERFORM'],['NRS','EVALUATE'],['NRS','RECONCILE']];
function run(events) { let state=createTrialState();for(const [role,action] of events){const result=applyTrialAction(state,role,action,state.version);assert.equal(result.ok,true,action);state=result.state;}return state; }
test('no invoice before service completion',()=>{for(let i=0;i<visit.length;i++){const state=run(visit.slice(0,i));for(const action of ['ISSUE_INVOICE','SETTLE_INVOICE']) assert.equal(applyTrialAction(state,'ADM',action,state.version).ok,false);}});
test('invoice issued after completion and settled only once',()=>{const done=run(visit);assert.equal(applyTrialAction(done,'PAT','ISSUE_INVOICE',done.version).ok,false);assert.equal(applyTrialAction(done,'ADM','SETTLE_INVOICE',done.version).ok,false);const issued=applyTrialAction(done,'ADM','ISSUE_INVOICE',done.version).state;assert.equal(issued.billing,'ISSUED');assert.equal(applyTrialAction(issued,'ADM','ISSUE_INVOICE',issued.version).ok,false);const paid=applyTrialAction(issued,'ADM','SETTLE_INVOICE',issued.version).state;assert.equal(paid.billing,'SETTLED');assert.equal(applyTrialAction(paid,'ADM','SETTLE_INVOICE',paid.version).ok,false);assert.equal(paid.status,'COMPLETED');});
test('one synthetic offer at a time, decline advances candidate',()=>{const state=run(dispatch);assert.equal(state.offer,'NURSE_B');const next=applyTrialAction(state,'NRS','DECLINE',state.version).state;assert.equal(next.offer,'NURSE_C');assert.equal(applyTrialAction(next,'NRS','ACCEPT',state.version).ok,false);});
test('database serializes simultaneous actions and isolates sessions',async(t)=>{assert.ok(process.env.TRIAL_DATABASE_URL,'CI must supply database');const store=new TrialStore(process.env.TRIAL_DATABASE_URL);t.after(()=>store.close());const session=await store.create();assert.equal(session.code,201);const input={id:session.id,token:session.tokens.PAT,role:'PAT',action:'REQUEST',version:0};const both=await Promise.all([store.act(input),store.act(input)]);assert.deepEqual(both.map(x=>x.code).sort(),[200,409]);assert.equal(both.find(x=>x.code===200).state.version,1);const other=await store.create();assert.equal((await store.act({...input,token:other.tokens.PAT})).code,404);assert.equal((await store.act({...input,version:undefined})).code,400);let version=1;for(const [role,action] of dispatch.slice(1,-1)){const result=await store.act({...input,token:session.tokens[role],role,action,version});assert.equal(result.code,200,action);version=result.state.version;}const accept={...input,token:session.tokens.NRS,role:'NRS',action:'ACCEPT',version};const responses=await Promise.all([store.act(accept),store.act(accept)]);assert.deepEqual(responses.map(x=>x.code).sort(),[200,409]);});

test('role token cannot impersonate another role; read projection is scoped',async(t)=>{
  const store=new TrialStore(process.env.TRIAL_DATABASE_URL);t.after(()=>store.close());
  const session=await store.create();
  assert.equal((await store.act({id:session.id,token:session.tokens.PAT,role:'ADM',action:'READ',version:0})).code,404);
  const doctor=await store.act({id:session.id,token:session.tokens.DOC,role:'DOC',action:'READ',version:0});
  assert.equal(doctor.code,200);assert.equal('billing' in doctor.state,false);assert.equal('offer' in doctor.state,false);
});

test('consent atomically opens an offer without an administrator action',async(t)=>{
 const store=new TrialStore(process.env.TRIAL_DATABASE_URL);t.after(()=>store.close());
 const session=await store.create();let version=0;
 for(const action of ['REQUEST','SCREEN','VERIFY_DESTINATION','CONSENT']){
  const result=await store.act({id:session.id,token:session.tokens.PAT,role:'PAT',action,version});
  assert.equal(result.code,200);version=result.state.version;
 }
 const nurse=await store.act({id:session.id,token:session.tokens.NRS,role:'NRS',action:'READ',version});
 assert.equal(nurse.state.status,'CONFIRMED');assert.equal(nurse.state.offer,'NURSE_B');
 const duplicate=await store.act({id:session.id,token:session.tokens.ADM,role:'ADM',action:'DISPATCH',version});
 assert.equal(duplicate.code,409);
});
