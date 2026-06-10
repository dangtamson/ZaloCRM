import { prisma } from '../../../shared/database/prisma-client.js';
import { logger } from '../../../shared/utils/logger.js';
import { sendTelegramText, type TelegramConfig } from '../../integrations/providers/telegram-bot.js';

export type AutomationTelegramNotification = {
  orgId: string;
  status: 'success' | 'failed';
  mode: 'worker' | 'manual';
  taskId?: string | null;
  triggerName?: string | null;
  campaignId?: string | null;
  actionType?: string | null;
  contactId?: string | null;
  errorMessage?: string | null;
  telegramIntegrationId?: string | null;
  extraLines?: string[];
};

export async function notifyAutomationRunTelegram(input: AutomationTelegramNotification): Promise<void> {
  try {
    const selectedIntegrationId = input.telegramIntegrationId?.trim();
    const integration = await prisma.integration.findFirst({
      where: {
        ...(selectedIntegrationId ? { id: selectedIntegrationId } : {}),
        orgId: input.orgId,
        type: 'telegram',
        enabled: true,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, config: true },
    });
    if (!integration) return;

    const text = buildAutomationNotificationText(input);
    const result = await sendTelegramText(integration.config as TelegramConfig, text);
    if (result.status !== 'success') {
      logger.warn(`[automation-telegram] notification failed for integration ${integration.id}: ${result.errorMessage}`);
    }
  } catch (error) {
    logger.warn('[automation-telegram] notification failed:', error);
  }
}

function buildAutomationNotificationText(input: AutomationTelegramNotification): string {
  const title = input.status === 'success'
    ? '✅ Automation chạy thành công'
    : '❌ Automation chạy lỗi';
  const lines = [
    title,
    '',
    `Nguồn: ${input.mode === 'manual' ? 'Chạy thủ công' : 'Worker tự động'}`,
  ];

  if (input.triggerName) lines.push(`Trigger: ${input.triggerName}`);
  if (input.actionType) lines.push(`Action: ${input.actionType}`);
  if (input.taskId) lines.push(`Task: ${input.taskId}`);
  if (input.campaignId) lines.push(`Campaign: ${input.campaignId}`);
  if (input.contactId) lines.push(`Contact: ${input.contactId}`);
  if (Array.isArray(input.extraLines)) {
    for (const line of input.extraLines) {
      if (line.trim()) lines.push(line.trim());
    }
  }
  if (input.errorMessage) lines.push(`Lỗi: ${input.errorMessage}`);

  lines.push(`Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
  return lines.join('\n');
}
