export type NotificationPayload = {
  title: string;
  content: string;
};

export async function notifyOwner(_payload: NotificationPayload): Promise<boolean> {
  // Local mode: no-op
  return true;
}

