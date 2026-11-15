import 'reflect-metadata';
import { Body, Controller, Get, Header, HttpCode, HttpException, Module, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AccountStore } from './account-store.mjs';
import { TrialStore } from './trial-store.mjs';

const enabled = process.env.MADISING_TRIAL_ENABLED === '1';
@Controller()
class TrialController {
  private readonly store = enabled ? new TrialStore(process.env.TRIAL_DATABASE_URL) : null;
  private readonly accounts=this.store?new AccountStore(this.store.pool):null;
  @Get('healthz')
  @Header('Cache-Control', 'no-store')
  health() { return { status:'ok', mode:'synthetic-only', clinicalData:false }; }
  @Get('readyz')
  @Header('Cache-Control', 'no-store')
  async ready() {
    if (!this.store) throw new HttpException('trial_disabled',503);
    await this.store.ready().catch(() => { throw new HttpException('not_ready',503); });
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
  app.useBodyParser('json',{limit:'4kb'});
  app.enableShutdownHooks();
  await app.listen(3001,'127.0.0.1');
}
bootstrap().catch(() => { console.error('Unable to start staging API'); process.exitCode=1; });
