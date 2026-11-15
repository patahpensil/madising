import 'reflect-metadata';
import { Body, Controller, Get, Header, HttpCode, HttpException, Module, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TrialStore } from './trial-store.mjs';

const enabled = process.env.MADISING_TRIAL_ENABLED === '1';
@Controller()
class TrialController {
  private readonly store = enabled ? new TrialStore(process.env.TRIAL_DATABASE_URL) : null;
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
    if (!this.store) throw new HttpException('trial_disabled',503);
    const result = await this.store.create().catch(() => { throw new HttpException('not_ready',503); });
    if (result.code !== 201) throw new HttpException('trial_capacity',429);
    return result;
  }
  @Post('trial/actions')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async action(@Body() input: unknown) {
    if (!this.store) throw new HttpException('trial_disabled',503);
    const result = await this.store.act(input).catch(() => { throw new HttpException('not_ready',503); });
    if (result.code !== 200 && result.code !== 409) throw new HttpException('invalid_trial_request',result.code);
    if (result.code === 409) throw new HttpException(result,409);
    return result;
  }
  async onModuleDestroy() { await this.store?.close(); }
}
@Module({controllers:[TrialController]})
class AppModule {}
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger:['error','warn'], bodyParser:false });
  app.useBodyParser('json',{limit:'4kb'});
  app.enableShutdownHooks();
  await app.listen(3001,'127.0.0.1');
}
bootstrap().catch(() => { console.error('Unable to start staging API'); process.exitCode=1; });
