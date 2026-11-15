import {Pool} from 'pg';
import {AccountStore} from '../src/account-store.mjs';
if(process.env.MADISING_ACCOUNT_TRIAL!=='1'||!process.env.TRIAL_DATABASE_URL)throw new Error('Isolated account trial must be enabled');
const pool=new Pool({connectionString:process.env.TRIAL_DATABASE_URL,max:1,connectionTimeoutMillis:3000,statement_timeout:5000});
try{const [role,username,exerciseId]=process.argv.slice(2);console.log(JSON.stringify(await new AccountStore(pool).provision({role,username,exerciseId,password:process.env.TRIAL_ACCOUNT_PASSWORD})));}finally{await pool.end();}
