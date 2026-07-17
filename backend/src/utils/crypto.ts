import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.JWT_SECRET || 'securevote_super_secret_jwt_key_12345';
// Ensure key is 32 bytes
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET_KEY).digest();
const IV_LENGTH = 16;

export function encryptVote(candidateId: string, electionId: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const data = JSON.stringify({ candidateId, electionId, salt: crypto.randomBytes(8).toString('hex') });
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptVote(encryptedVote: string): { candidateId: string; electionId: string } | null {
  try {
    const textParts = encryptedVote.split(':');
    const iv = Buffer.from(textParts.shift() || '', 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to decrypt vote:', error);
    return null;
  }
}

export function generateVerificationHash(voteData: string): string {
  return crypto.createHash('sha256').update(voteData).digest('hex').substring(0, 16).toUpperCase();
}
