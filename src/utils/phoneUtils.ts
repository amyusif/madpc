/**
 * Utility functions for phone number formatting and validation
 */

export function formatPhoneForSMS(phone: string, defaultCountryCode: string = "+233"): string {
  if (!phone) return "";
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // If already has country code (starts with country code digits)
  if (phone.startsWith("+")) {
    return phone;
  }
  
  // Ghana specific formatting
  if (defaultCountryCode === "+233") {
    // If starts with 0, replace with +233
    if (digits.startsWith("0")) {
      return "+233" + digits.substring(1);
    }
    
    // If starts with 233, add +
    if (digits.startsWith("233")) {
      return "+" + digits;
    }
    
    // If 9 digits (typical Ghana mobile without 0), add +233
    if (digits.length === 9) {
      return "+233" + digits;
    }
  }
  
  // Default: add country code if no + prefix
  return defaultCountryCode + digits;
}

export function validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" };
  }
  
  const formatted = formatPhoneForSMS(phone);
  
  // Basic validation - should start with + and have reasonable length
  if (!formatted.startsWith("+")) {
    return { isValid: false, error: "Phone number should include country code" };
  }
  
  const digits = formatted.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    return { isValid: false, error: "Phone number length is invalid" };
  }
  
  return { isValid: true };
}

export function displayPhoneNumber(phone: string): string {
  if (!phone) return "";
  
  const formatted = formatPhoneForSMS(phone);
  
  // Ghana number formatting for display
  if (formatted.startsWith("+233")) {
    const local = formatted.substring(4);
    if (local.length === 9) {
      return `+233 ${local.substring(0, 2)} ${local.substring(2, 5)} ${local.substring(5)}`;
    }
  }
  
  return formatted;
}
