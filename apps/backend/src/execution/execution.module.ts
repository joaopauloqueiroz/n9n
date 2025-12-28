import { Module, Global } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { ExecutionEngineService } from './execution-engine.service';
import { NodeExecutorService } from './node-executor.service';
import { ContextService } from './context.service';
import { WhatsappSenderService } from './whatsapp-sender.service';
import { ScheduleWorker } from '../worker/schedule.worker';

@Global()
@Module({
  providers: [
    ExecutionService,
    ExecutionEngineService,
    NodeExecutorService,
    ContextService,
    WhatsappSenderService,
    ScheduleWorker,
  ],
  exports: [
    ExecutionService,
    ExecutionEngineService,
    NodeExecutorService,
    WhatsappSenderService,
  ],
})
export class ExecutionModule {}

