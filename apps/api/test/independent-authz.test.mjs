import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeAction} from '../src/authz.mjs';
test('independent authorization regression: absent or invalid account ID never equals absent scope',()=>{
 for(const id of [undefined,null,'',0,{},[]])for(const [role,kind,action,scope] of [['PAT','PATIENT','booking.read','patientAccountId'],['NRS','CLINICIAN','clinical.read','assignedNurseAccountId'],['DOC','CLINICIAN','prescription.create','authorizedDoctorAccountId'],['CUR','COURIER','delivery.task.read','assignedCourierAccountId']]){
  const actor={account:{id,kind,state:'ACTIVE',contactVerified:true},authn:{mfa:true},bindings:[{role,state:'ACTIVE',credentialState:'VERIFIED',credentialValidUntil:new Date(Date.now()+86400000).toISOString()}]};
  assert.equal(authorizeAction(actor,action,{[scope]:id,encounterState:'ACTIVE'}),false,role+' invalid identifier');
 }
});
