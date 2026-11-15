import assert from 'node:assert/strict';
const origin='http://127.0.0.1:3000';
async function post(body,requestOrigin=origin){
 const res=await fetch(origin+'/trial-api',{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 return {status:res.status,body:await res.json()};
}
assert.equal((await post({operation:'create'},'https://invalid.example')).status,403);
const session=await post({operation:'create'});assert.equal(session.status,201);
const {id,tokens}=session.body;let version=0;
async function act(role,action){const res=await post({operation:'action',id,token:tokens[role],role,action,version});assert.equal(res.status,200,action);version=res.body.state.version;return res.body.state;}
assert.equal((await post({operation:'action',id,token:tokens.PAT,role:'ADM',action:'READ',version})).status,404);
for(const [role,action] of [['PAT','REQUEST'],['PAT','SCREEN'],['PAT','VERIFY_DESTINATION'],['PAT','CONSENT'],['ADM','DISPATCH'],['NRS','ACCEPT'],['NRS','DEPART'],['NRS','LOCATION_STEP']])await act(role,action);
let read=await post({operation:'read',id,token:tokens.PAT,role:'PAT',action:'READ',version});assert.equal(read.status,200);assert.equal(read.body.state.tracking.source,'SYNTHETIC');
await act('NRS','ARRIVE');read=await post({operation:'read',id,token:tokens.PAT,role:'PAT',action:'READ',version});assert.equal('tracking' in read.body.state,false);
for(const [role,action] of [['NRS','ASSESS'],['NRS','PLAN'],['NRS','PERFORM'],['NRS','EVALUATE'],['NRS','RECONCILE'],['ADM','ISSUE_INVOICE'],['ADM','SETTLE_INVOICE']])await act(role,action);
read=await post({operation:'read',id,token:tokens.PAT,role:'PAT',action:'READ',version});assert.equal(read.body.state.billing,'SETTLED');assert.equal(read.body.state.status,'COMPLETED');
console.log('Synthetic web HTTP journey and role isolation passed');
