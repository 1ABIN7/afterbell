export const validateEmail = (email: string): { isValid: boolean; error: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (email.length > 254) {
    return { isValid: false, error: 'Email exceeds maximum length of 254 characters' };
  }
  
  // RFC 5322 (HTML5) standard compliant regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address structure' };
  }
  
  // Strict TLD check: must be at least 2 chars and strictly alphabetical
  const parts = email.split('.');
  const tld = parts[parts.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, error: 'Please include a valid alphabetical domain suffix (e.g., .com or .in)' };
  }
  
  return { isValid: true, error: '' };
};

export const validatePhone = (phone: string): { isValid: boolean; error: string } => {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  // Strip non-digits
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length !== 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits' };
  }
  
  // Indian number prefix validation (must start with 6, 7, 8, or 9)
  if (!/^[6-9]/.test(digits)) {
    return { isValid: false, error: 'Indian phone numbers must start with 6, 7, 8, or 9' };
  }
  
  return { isValid: true, error: '' };
};
