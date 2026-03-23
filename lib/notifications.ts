type NotificationChannel = "mock" | "whatsapp" | "email";

export type NotificationPayload = {
  id: string;
  message: string;
  kind: "task_due_soon" | "low_stock";
  channel?: NotificationChannel;
};

const sentNotificationIds = new Set<string>();

export async function sendNotification(payload: NotificationPayload) {
  const channel = payload.channel ?? "mock";

  if (channel === "mock") {
    if (!sentNotificationIds.has(payload.id)) {
      console.info(`[notification:${payload.kind}] ${payload.message}`);
      sentNotificationIds.add(payload.id);
    }

    return;
  }

  console.info(
    `[notification:${channel}] Pending real integration for: ${payload.message}`
  );
}

export async function sendNotifications(payloads: NotificationPayload[]) {
  for (const payload of payloads) {
    await sendNotification(payload);
  }
}
