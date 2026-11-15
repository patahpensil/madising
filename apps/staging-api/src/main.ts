import 'reflect-metadata';
import { Body, Controller, Get, Header, HttpCode, HttpException, Module, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AccountStore } from './account-store.mjs';
import { AccessStore } from './access-store.mjs';
import { TrialStore } from './trial-store.mjs';

const enabled = process.env.MADISING_TRIAL_ENABLED === '1';
@Controller()
class TrialController {
  private readonly store = enabled ? new TrialStore(process.env.TRIAL_DATABASE_URL) : null;
  private readonly accounts=this.store?new AccountStore(this.store.pool):null;
  private readonly access=this.store&&process.env.MADISING_ACCOUNT_TRIAL==='1'?new AccessStore(this.store.pool):null;
  private async accessCall(work:(store:AccessStore)=>Promise<{code:number}&Record<string,unknown>>, ok:number[]){
    if(!this.access)throw new HttpException('disabled',503);
    const result=await work(this.access).catch(()=>{throw new HttpException('unavailable',503);});
    if(!ok.includes(result.code))throw new HttpException(result,result.code);
    return result;
  }
  @Post('account/otp/request')
  @HttpCode(202)
  @Header('Cache-Control','no-store')
  otpRequest(@Body() input: any){ return this.accessCall(s=>s.requestOtp(input),[202]); }
  @Post('account/otp/verify')
  @HttpCode(200)
  @Header('Cache-Control','no-store')
  otpVerify(@Body() input: any){ return this.accessCall(s=>s.verifyOtp(input),[200,202]); }
  @Post('account/preferences')
  @HttpCode(200)
  @Header('Cache-Control','no-store')
  preferences(@Body() input: any){ return this.accessCall(s=>s.preferences(input?.token,input?.patch),[200]); }
  @Post('account/passkeys/register/options')
  @HttpCode(200)
  @Header('Cache-Control','no-store')
  passkeyRegisterOptions(@Body() input: any){ return this.accessCall(s=>s.passkeyRegistrationOptions(input?.token),[200]); }
  @Post('account/passkeys/register/verify')
  @HttpCode(201)
  @Header('Cache-Control','no-store')
  passkeyRegisterVerify(@Body() input: any){ return this.accessCall(s=>s.passkeyRegistrationVerify(input?.token,input),[201]); }
  @Post('account/passkeys/authenticate/options')
  @HttpCode(200)
  @Header('Cache-Control','no-store')
  passkeyAuthOptions(){ return this.accessCall(s=>s.passkeyAuthenticationOptions(),[200]); }
  @Post('account/passkeys/authenticate/verify')
  @HttpCode(200)
  @Header('Cache-Control','no-store')
  passkeyAuthVerify(@Body() input: any){ return this.accessCall(s=>s.passkeyAuthenticationVerify(input),[200]); }
  @Post('account/passkeys')
  @HttpCode(200)
  @Header('Cache-Control','no-store')
  passkeyList(@Body() input: any){ return this.accessCall(s=>s.passkeys(input?.token,input?.remove),[200]); }
  @Post('account/care-team')
  @HttpCode(200)
  @Header('Cache-Control','no-store')
  careTeam(@Body() input: any){ return this.accessCall(s=>s.careTeam(input?.token),[200]); }
  @Post('account/reviews')
  @HttpCode(201)
  @Header('Cache-Control','no-store')
  review(@Body() input: any){ return this.accessCall(s=>s.review(input?.token,input),[201]); }
  @Get('healthz')
  @Header('Cache-Control', 'no-store')
  health() { return { status:'ok', mode:'synthetic-only', clinicalData:false }; }
  @Get('readyz')
  @Header('Cache-Control', 'no-store')
  async ready() {
    if (!this.store) throw new HttpException('trial_disabled',503);
    await this.store.ready().catch(() => { throw new HttpException('not_ready',503); });
    if(process.env.MADISING_ACCOUNT_TRIAL==='1'){
      await this.store.pool.query('SELECT 1 FROM madising_trial.accounts LIMIT 1').catch(()=>{throw new HttpException('not_ready',503);});
      await this.store.pool.query('SELECT 1 FROM madising_trial.account_sessions LIMIT 1').catch(()=>{throw new HttpException('not_ready',503);});
      await this.store.pool.query('SELECT 1 FROM madising_trial.otp_challenges LIMIT 1').catch(()=>{throw new HttpException('not_ready',503);});
    }
    return { status:'ready', mode:'synthetic-only' };
  }
  @Post('trial/sessions')
  @HttpCode(201)
  @Header('Cache-Control', 'no-store')
  async create() {
    if (process.env.MADISING_FIXTURE_HARNESS !== '1' || !this.store) throw new HttpException('trial_disabled',503);
    const result = await this.store.create().catch(() => { throw new HttpException('not_ready',503); });
    if (result.code !== 201) throw new HttpException('trial_capacity',429);
    return result;
  }
  @Post('trial/actions')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async action(@Body() input: unknown) {
    if (process.env.MADISING_FIXTURE_HARNESS !== '1' || !this.store) throw new HttpException('trial_disabled',503);
    const result = await this.store.act(input).catch(() => { throw new HttpException('not_ready',503); });
    if (result.code !== 200 && result.code !== 409) throw new HttpException('invalid_trial_request',result.code);
    if (result.code === 409) throw new HttpException(result,409);
    return result;
  }
  @Post('account/register')
  @HttpCode(202)
  @Header('Cache-Control','no-store')
  async register(@Body() input: unknown) {
    if(!this.accounts||process.env.MADISING_ACCOUNT_TRIAL!=='1')throw new HttpException('disabled',503);
    const result=await this.accounts.register(input).catch(()=>{throw new HttpException('unavailable',503);});
    if(result.code!==202)throw new HttpException('registration_unavailable',result.code);
    return {code:202};
  }
  @Post('account/login')
  @HttpCode(200)
  @Header('Cache-Control','no-store')
  async login(@Body() input: unknown) {
    if(!this.accounts||process.env.MADISING_ACCOUNT_TRIAL!=='1')throw new HttpException('disabled',503);
    const result=await this.accounts.login(input).catch(()=>{throw new HttpException('unavailable',503);});
    if(result.code!==200)throw new HttpException('login_not_available',result.code);
    return result;
  }
  @Post('account/logout')
  @HttpCode(200)
  @Header('Cache-Control','no-store')
  async logout(@Body() input: {token?:string}) {
    if(!this.accounts||process.env.MADISING_ACCOUNT_TRIAL!=='1')throw new HttpException('disabled',503);
    return await this.accounts.logout(input?.token);
  }
  @Post('account/action')
  @HttpCode(200)
  @Header('Cache-Control','no-store')
  async accountAction(@Body() input: unknown) {
    if(!this.store||process.env.MADISING_ACCOUNT_TRIAL!=='1')throw new HttpException('disabled',503);
    const result=await this.store.act(input,true).catch(()=>{throw new HttpException('unavailable',503);});
    if(result.code!==200)throw new HttpException(result,result.code);
    return result;
  }
  async onModuleDestroy() { await this.store?.close(); }
}
@Module({controllers:[TrialController]})
class AppModule {}
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger:['error','warn'], bodyParser:false });
  app.useBodyParser('json',{limit:'8kb'});
  app.enableShutdownHooks();
  await app.listen(3001,'127.0.0.1');
}
bootstrap().catch(() => { console.error('Unable to start staging API'); process.exitCode=1; });
