interface OTPStore {
  code: string;
  expiresAt: Date;
}

const otpCache = new Map<string, OTPStore>();

export function generateOTP(key: string): string {
  // Generate 6 digit numeric code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiry to 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  
  otpCache.set(key, { code, expiresAt });
  
  // Log the OTP in terminal for easy testing/dev access
  console.log(`[DEV OTP BYPASS] Generated OTP for key ${key}: ${code} (Expires in 5 minutes)`);
  
  return code;
}

export function verifyOTP(key: string, code: string): boolean {
  const record = otpCache.get(key);
  
  if (!record) {
    return false;
  }
  
  if (new Date() > record.expiresAt) {
    otpCache.delete(key);
    return false;
  }
  
  const isValid = record.code === code;
  if (isValid) {
    otpCache.delete(key); // Use once
  }
  
  return isValid;
}
