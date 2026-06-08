export const SEND_MESSAGE_TARGET_DELAY_MS = Number(process.env.AUTOMATION_SEND_TARGET_DELAY_MS ?? 1500);

export async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}
