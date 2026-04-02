import { logger } from "./logger";

export interface SmsResult {
  contactName: string;
  phone: string;
  success: boolean;
  message: string;
}

export async function sendFallAlert(
  contactName: string,
  ntfyTopic: string,
  location?: string | null,
  notes?: string | null
): Promise<SmsResult> {
  const locationText = location ? ` Location: ${location}.` : "";
  const notesText = notes ? ` Notes: ${notes}.` : "";
  const title = "FALL DETECTED - Immediate Attention Required";
  const body = `A fall has been detected and requires immediate attention.${locationText}${notesText} Please check on the person immediately.`;

  const cleanTopic = ntfyTopic.trim().replace(/\s+/g, "-");

  try {
    const response = await fetch(`https://ntfy.sh/${encodeURIComponent(cleanTopic)}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Title": title,
        "Priority": "urgent",
        "Tags": "rotating_light,warning",
      },
      body,
    });

    if (response.ok) {
      logger.info({ contactName, ntfyTopic: cleanTopic }, "Notification sent via ntfy.sh");
      return {
        contactName,
        phone: ntfyTopic,
        success: true,
        message: `Alert sent to topic "${cleanTopic}". Open ntfy app and subscribe to this topic to receive alerts.`,
      };
    } else {
      const errText = await response.text().catch(() => "Unknown error");
      logger.warn({ contactName, ntfyTopic: cleanTopic, status: response.status, errText }, "ntfy.sh notification failed");
      return {
        contactName,
        phone: ntfyTopic,
        success: false,
        message: `Failed to send notification (HTTP ${response.status}): ${errText}`,
      };
    }
  } catch (err) {
    logger.error({ contactName, ntfyTopic: cleanTopic, err }, "ntfy.sh send error");
    return {
      contactName,
      phone: ntfyTopic,
      success: false,
      message: "Network error while sending notification",
    };
  }
}
