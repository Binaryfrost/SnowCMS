import crypto from 'crypto';
import type { Request, RequestHandler } from 'express';

export function asyncRouteFix<T extends RequestHandler>(callback: T): RequestHandler {
  return (req, res, next) => {
    new Promise((resolve) => {
      resolve(callback(req, res, next));
    }).catch(next);
  };
}

export function getAuthToken(req: Request) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.includes(':')) {
    return null;
  }

  const authHeaderParts = authorization.split(' ');
  if (authHeaderParts.length < 2 || authHeaderParts[0] !== 'Bearer') {
    return null;
  }

  const token = authHeaderParts[1];
  return token;
}

function deriveKeyFromSecret(secret: string) {
  return crypto.createHash('sha256').update(secret).digest('base64').substring(0, 32);
}

const ENCRYPT_ALGORITHM = 'aes256';
export function encrypt(secret: string, data: string) {
  const iv = crypto.randomBytes(8).toString('hex');
  const key = deriveKeyFromSecret(secret);
  const cipher = crypto.createCipheriv(ENCRYPT_ALGORITHM, key, iv);
  return {
    iv,
    encrypted: cipher.update(data, 'utf8', 'base64') + cipher.final('base64')
  };
}

export function decrypt(encrypted: string, secret: string, iv: string) {
  const key = deriveKeyFromSecret(secret);
  const decipher = crypto.createDecipheriv(ENCRYPT_ALGORITHM, key, iv);
  return decipher.update(encrypted, 'base64', 'utf8') + decipher.final('utf8');
}
