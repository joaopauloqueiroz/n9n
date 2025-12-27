import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappSessionManager } from './whatsapp-session-manager.service';
import { WhatsappMessageHandler } from './whatsapp-message-handler.service';
import { WhatsappInitService } from './whatsapp-init.service';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [ExecutionModule],
  providers: [
    WhatsappService,
    WhatsappSessionManager,
    WhatsappMessageHandler,
    WhatsappInitService,
  ],
  exports: [WhatsappService, WhatsappSessionManager],
})
export class WhatsappModule {}

