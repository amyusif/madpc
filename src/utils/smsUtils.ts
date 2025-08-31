import { sendSingleSMS, validatePhoneNumber, formatPhoneNumber } from '@/utils/smsService';

export async function sendSMS(phone: string, message: string, scheduleAt?: string): Promise<void> {
  try {
    // Validate and format the phone number
    if (!validatePhoneNumber(phone)) {
      throw new Error(`Invalid phone number format: ${phone}`);
    }

    const formattedPhone = formatPhoneNumber(phone);
    
    // Send SMS using UelloSend
    const result = await sendSingleSMS(formattedPhone, message);

    if (!result.success) {
      throw new Error(result.error || 'Failed to send SMS');
    }

    console.log("[SMS] Message sent successfully to:", formattedPhone);
  } catch (error) {
    console.error("[SMS] Send failed:", error);
    throw error;
  }
}
