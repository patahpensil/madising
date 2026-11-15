import test from 'node:test';
import assert from 'node:assert/strict';
import {validate} from './preflight.mjs';
import {readFileSync} from 'node:fs';
const common={MADISING_ACCOUNT_TRIAL:'1',MADISING_FIXTURE_HARNESS:'0'};
const api={...common,MADISING_TRIAL_ENABLED:'1',TRIAL_DATABASE_URL:'postgresql://madising_runtime:synthetic-only@db.internal/madising_trial?sslmode=verify-full'};
const web={...common,TRIAL_WEB_ORIGIN:'https://staging.example.test'};
test('isolated API and web settings accepted',()=>{assert.deepEqual(validate('api',api,22),[]);assert.deepEqual(validate('web',web,22),[]);});
test('database boundary refuses wrong schema identity, weak TLS, unexpected parameters and missing secret',()=>{
 for(const value of [undefined,'postgresql://madising_runtime:synthetic-only@db.internal/production?sslmode=verify-full','postgresql://postgres:synthetic-only@db.internal/madising_trial?sslmode=verify-full','postgresql://madising_runtime:synthetic-only@db.internal/madising_trial?sslmode=require','postgresql://madising_runtime:synthetic-only@db.internal/madising_trial?sslmode=verify-full&sslmode=disable','postgresql://madising_runtime@db.internal/madising_trial?sslmode=verify-full','postgresql://madising_runtime:synthetic-only@db.internal/madising_trial?sslmode=verify-full&options=x'])assert.ok(validate('api',{...api,TRIAL_DATABASE_URL:value},22).length);
 assert.ok(validate('api',{...api,NODE_TLS_REJECT_UNAUTHORIZED:'0'},22).length);
});
test('web boundary rejects insecure origin, public preview, path and database credentials',()=>{
 for(const value of [undefined,'http://staging.example.test','https://madising.example.workers.dev','https://staging.example.test/path','https://staging.example.test/','https://user:password@staging.example.test'])assert.ok(validate('web',{...web,TRIAL_WEB_ORIGIN:value},22).length);
 assert.ok(validate('web',{...web,TRIAL_DATABASE_URL:api.TRIAL_DATABASE_URL},22).length);
});
test('invalid mode and untested Node major fail closed',()=>{assert.ok(validate('web',{...web,MADISING_FIXTURE_HARNESS:'1'},22).length);assert.ok(validate('web',web,24).length);});
test('service separation and loopback web bind are retained in templates',()=>{
 const apiUnit=readFileSync(new URL('./madising-staging-api.service',import.meta.url),'utf8');
 const webUnit=readFileSync(new URL('./madising-staging-web.service',import.meta.url),'utf8');
 assert.match(apiUnit,/User=madising-api/);assert.match(webUnit,/User=madising-web/);assert.match(webUnit,/--hostname 127\.0\.0\.1 --port 3000/);
 for(const v of [apiUnit,webUnit]){assert.match(v,/ProtectSystem=strict/);assert.match(v,/ExecStartPre=/);assert.match(v,/MADISING_FIXTURE_HARNESS=0/);}
});
