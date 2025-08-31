// Using native fetch instead of axios for SMS requests

// Use environment variables for API credentials
const UELLOSEND_API_KEY = process.env.UELLOSEND_API_KEY || '';
const UELLOSEND_API_SECRET = process.env.UELLOSEND_API_SECRET || '';
const UELLOSEND_SENDER_ID = process.env.UELLOSEND_SENDER_ID || 'MADPC';

interface SendSMSResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Send a single SMS message using UelloSend API
 */
export async function sendSingleSMS(
  recipient: string,
  message: string
): Promise<SendSMSResponse> {
  try {
    // Check if API credentials are configured
    if (!UELLOSEND_API_KEY || !UELLOSEND_API_SECRET) {
      throw new Error('UelloSend API credentials not configured. Please set UELLOSEND_API_KEY and UELLOSEND_API_SECRET environment variables.');
    }

    // Format phone number to local Ghana format (0XXXXXXXXX)
    const formattedPhone = formatPhoneNumber(recipient);
    
    console.log(`[SMS] Sending to ${formattedPhone}: ${message.substring(0, 50)}...`);
    console.log(`[SMS] Using API Key: ${UELLOSEND_API_KEY ? UELLOSEND_API_KEY.substring(0, 20) + '...' : 'NOT SET'}`);

    const requestBody = {
      api_key: UELLOSEND_API_KEY,
      sender_id: UELLOSEND_SENDER_ID,
      message: message,
      recipient: formattedPhone
    };

    const response = await fetch('https://uellosend.com/quicksend/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log('[SMS] UelloSend response:', responseData);

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if the API returned an error in the response body
    if (responseData && responseData.status === 'error') {
      throw new Error(responseData.message || 'UelloSend API returned error');
    }

    return {
      success: true,
      message: 'Message sent successfully',
    };
  } catch (error: any) {
    console.error('SMS sending error:', error);
    
    let errorMessage = 'Failed to send message';
    if (error.response) {
      // API responded with error status
      errorMessage = `API Error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error: Unable to reach SMS service';
    } else {
      // Other error
      errorMessage = error.message || 'Unknown error occurred';
    }

    return {
      success: false,
      message: 'Failed to send message',
      error: errorMessage
    };
  }
}

/**
 * Send bulk SMS messages
 */
export async function sendBulkSMS(
  recipients: string[],
  message: string
): Promise<SendSMSResponse> {
  try {
    // Check if API credentials are configured
    if (!UELLOSEND_API_KEY || !UELLOSEND_API_SECRET) {
      throw new Error('UelloSend API credentials not configured. Please set UELLOSEND_API_KEY and UELLOSEND_API_SECRET environment variables.');
    }

    // Format all phone numbers to local Ghana format
    const formattedRecipients = recipients.map(phone => formatPhoneNumber(phone));
    
    console.log(`[SMS] Sending bulk SMS to ${formattedRecipients.length} recipients`);

    const requestBody = {
      api_key: UELLOSEND_API_KEY,
      sender_id: UELLOSEND_SENDER_ID,
      message: message,
      recipient: formattedRecipients
    };

    const response = await fetch('https://uellosend.com/campaign/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log('[SMS] Bulk SMS response:', responseData);

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if the API returned an error in the response body
    if (responseData && responseData.status === 'error') {
      throw new Error(responseData.message || 'UelloSend API returned error');
    }

    return {
      success: true,
      message: 'Messages sent successfully',
    };
  } catch (error: any) {
    console.error('Bulk SMS sending error:', error);
    
    let errorMessage = 'Failed to send messages';
    if (error.response) {
      // API responded with error status
      errorMessage = `API Error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error: Unable to reach SMS service';
    } else {
      // Other error
      errorMessage = error.message || 'Unknown error occurred';
    }

    return {
      success: false,
      message: 'Failed to send messages',
      error: errorMessage
    };
  }
}

// Helper function to format phone numbers
export function formatPhoneNumber(phone: string): string {
  // Handle +233 prefix - convert to 0 format
  if (phone.startsWith('+233')) {
    return '0' + phone.slice(4); // Remove +233 and add 0
  }
  
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If number starts with '233', convert to 0 format
  if (cleaned.startsWith('233')) {
    return '0' + cleaned.slice(3);
  }
  
  // If already starts with 0, return as is
  if (cleaned.startsWith('0')) {
    return cleaned;
  }
  
  return cleaned;
}

// Helper function to validate phone numbers
export function validatePhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  
  // Check if it's a valid Ghana phone number
  // Should be 10 digits starting with 0 (02X or 05X)
  return /^0[25][0-9]{8}$/.test(formatted);
}
