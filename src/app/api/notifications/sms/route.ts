import { NextRequest, NextResponse } from 'next/server';
import { sendSingleSMS, sendBulkSMS, validatePhoneNumber, formatPhoneNumber } from '@/utils/smsService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, message, scheduleAt, recipients } = body;

    // Single SMS
    if (phone) {
      if (!validatePhoneNumber(phone)) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number format' },
          { status: 400 }
        );
      }

      const formattedPhone = formatPhoneNumber(phone);
      const result = await sendSingleSMS(formattedPhone, message);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to send SMS' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: result.message });
    }

    // Bulk SMS
    if (recipients && Array.isArray(recipients)) {
      // Validate and format all phone numbers
      const formattedRecipients = recipients
        .filter(validatePhoneNumber)
        .map(formatPhoneNumber);

      if (formattedRecipients.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid phone numbers provided' },
          { status: 400 }
        );
      }

      const result = await sendBulkSMS(formattedRecipients, message);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to send bulk SMS' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: result.message });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request: phone or recipients required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
