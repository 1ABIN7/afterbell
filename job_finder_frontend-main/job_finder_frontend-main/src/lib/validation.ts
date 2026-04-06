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
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  // Strict TLD check: must be at least 2 chars and strictly alphabetical
  const parts = email.split('.');
  const tld = parts[parts.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, error: 'Please include a valid domain suffix (e.g. .com, .in)' };
  }
  
  return { isValid: true, error: '' };
};

export const validatePhone = (phone: string): { isValid: boolean; error: string } => {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  // Clean value
  const val = phone.trim();
  const isInternational = val.startsWith('+');
  
  // Strip non-digits for pure numeric length validation
  const digits = val.replace(/\D/g, '');
  
  if (isInternational) {
    // Standard Global E.164 phone numbering usually falls between 10 and 15 digits
    if (digits.length < 10 || digits.length > 15) {
      return { isValid: false, error: 'International numbers must be between 10 and 15 digits' };
    }
  } else {
    // If no country code, default to standard local 10-digit number
    if (digits.length !== 10) {
      return { isValid: false, error: 'Phone number must be exactly 10 digits (add + for international)' };
    }
    
    // Strict local prefix checking
    if (!/^[6-9]/.test(digits)) {
      return { isValid: false, error: 'Local phone numbers must start with 6, 7, 8, or 9' };
    }
  }
  
  return { isValid: true, error: '' };
};
