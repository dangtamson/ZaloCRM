/**
 * telegram-bot.ts — Send CRM notifications via Telegram Bot API.
 * Config shape: { botToken: string, chatId: string, messageThreadId?: string | number }
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../../shared/database/prisma-client.js';
import { logger } from '../../../shared/utils/logger.js';

export interface TelegramConfig {
  botToken?: string;
  chatId?: string;
  messageThreadId?: string | number;
  message_thread_id?: string | number;
}

export async function sendTelegramNotification(
  orgId: string,
  config: TelegramConfig,
): Promise<{ direction: 'export'; recordCount: number; status: 'success' | 'failed'; errorMessage?: string }> {
  const { botToken, chatId } = config;
  const messageThreadId = parseMessageThreadId(config.messageThreadId ?? config.message_thread_id);

  if (!botToken || !chatId) {
    return { direction: 'export', recordCount: 0, status: 'failed', errorMessage: 'Missing botToken or chatId' };
  }

  // Build daily summary
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [newContacts, todayMessages, pendingAppointments] = await Promise.all([
    prisma.contact.count({ where: { orgId, createdAt: { gte: today } } }),
    prisma.message.count({
      where: { conversation: { orgId }, createdAt: { gte: today } },
    }),
    prisma.appointment.count({
      where: { orgId, status: 'scheduled', appointmentDate: { gte: today } },
    }),
  ]);

  const text = [
    '📊 *ZaloCRM — Tóm tắt hôm nay*',
    '',
    `👤 Khách hàng mới: ${newContacts}`,
    `💬 Tin nhắn: ${todayMessages}`,
    `📅 Lịch hẹn chờ: ${pendingAppointments}`,
    '',
    `🕐 ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
  ].join('\n');

  try {
    const response = await postTelegramMessage({ botToken, chatId, messageThreadId, text });

    if (!response.ok) {
      const body = await response.text();
      logger.error('[telegram-bot] API error:', body);
      return { direction: 'export', recordCount: 0, status: 'failed', errorMessage: `Telegram API ${response.status}: ${body.slice(0, 200)}` };
    }

    logger.info(`[telegram-bot] Sent daily summary to chat ${chatId}`);
    return { direction: 'export', recordCount: 1, status: 'success' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { direction: 'export', recordCount: 0, status: 'failed', errorMessage: msg };
  }
}

export async function sendTelegramText(
  config: TelegramConfig,
  text: string,
): Promise<{ status: 'success' | 'failed'; errorMessage?: string }> {
  const { botToken, chatId } = config;
  const messageThreadId = parseMessageThreadId(config.messageThreadId ?? config.message_thread_id);
  if (!botToken || !chatId) {
    return { status: 'failed', errorMessage: 'Missing botToken or chatId' };
  }

  try {
    const response = await postTelegramMessage({ botToken, chatId, messageThreadId, text });
    if (!response.ok) {
      const body = await response.text();
      logger.error('[telegram-bot] API error:', body);
      return { status: 'failed', errorMessage: `Telegram API ${response.status}: ${body.slice(0, 200)}` };
    }
    return { status: 'success' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: 'failed', errorMessage: msg };
  }
}

export async function sendTelegramPhoto(
  config: TelegramConfig,
  input: { url?: string; filePath?: string; caption?: string },
): Promise<{ status: 'success' | 'failed'; errorMessage?: string }> {
  const { botToken, chatId } = config;
  const messageThreadId = parseMessageThreadId(config.messageThreadId ?? config.message_thread_id);
  if (!botToken || !chatId) {
    return { status: 'failed', errorMessage: 'Missing botToken or chatId' };
  }
  if (!input.url && !input.filePath) {
    return { status: 'failed', errorMessage: 'Missing photo url or filePath' };
  }

  try {
    const response = await postTelegramPhoto({
      botToken,
      chatId,
      messageThreadId,
      photoUrl: input.url,
      filePath: input.filePath,
      caption: input.caption,
    });
    if (!response.ok) {
      const body = await response.text();
      logger.error('[telegram-bot] API error:', body);
      return { status: 'failed', errorMessage: `Telegram API ${response.status}: ${body.slice(0, 200)}` };
    }
    return { status: 'success' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: 'failed', errorMessage: msg };
  }
}

async function postTelegramMessage(input: {
  botToken: string;
  chatId: string;
  messageThreadId: number | null;
  text: string;
}): Promise<Response> {
  const url = `https://api.telegram.org/bot${input.botToken}/sendMessage`;
  const payload: Record<string, unknown> = {
    chat_id: input.chatId,
    text: input.text,
    parse_mode: 'Markdown',
  };
  if (input.messageThreadId !== null) payload.message_thread_id = input.messageThreadId;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
}

async function postTelegramPhoto(input: {
  botToken: string;
  chatId: string;
  messageThreadId: number | null;
  photoUrl?: string;
  filePath?: string;
  caption?: string;
}): Promise<Response> {
  const url = `https://api.telegram.org/bot${input.botToken}/sendPhoto`;
  const form = new FormData();
  form.append('chat_id', input.chatId);
  form.append('parse_mode', 'Markdown');
  if (input.messageThreadId !== null) form.append('message_thread_id', String(input.messageThreadId));
  if (input.caption?.trim()) form.append('caption', input.caption.trim());

  if (input.filePath) {
    try {
      const buffer = await readFile(input.filePath);
      const blob = new Blob([buffer]);
      form.append('photo', blob, path.basename(input.filePath));
    } catch (error) {
      if (!input.photoUrl) throw error;
      logger.warn(`[telegram-bot] local photo read failed, falling back to URL: ${(error as Error)?.message ?? String(error)}`);
      form.append('photo', input.photoUrl);
    }
  } else {
    form.append('photo', input.photoUrl!);
  }

  return fetch(url, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
}

function parseMessageThreadId(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
