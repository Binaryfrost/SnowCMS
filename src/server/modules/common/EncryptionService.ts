import crypto from 'crypto';
import AppConfigProvider from '../config/AppConfigProvider';
import Service from '../Service';
import InvalidHmacError from '../../../common/errors/InvalidHmacError';
import BadRequestError from '../../../common/errors/base/BadRequestError';

export interface EncryptedData {
  iv: string
  enc: string
  hmac: string
}

export default class EncryptionService extends Service {
  private ENCRYPT_ALGORITHM = 'aes-256-cbc';
  private secret: string;

  constructor(config: AppConfigProvider) {
    super();
    this.secret = config.getSecret();
  }

  async encrypt(payload: string): Promise<EncryptedData> {
    const iv = this.generateIv();
    const key = this.deriveKeyFromSecret();
    const cipher = crypto.createCipheriv(this.ENCRYPT_ALGORITHM, key, iv);

    const encodedIv = iv.toString('base64');
    const enc = cipher.update(payload, 'utf8', 'base64') + cipher.final('base64');

    return {
      iv: encodedIv,
      enc,
      hmac: await this.hmacEncrypted(encodedIv, enc)
    };
  }

  async encryptAsString(payload: string) {
    return Buffer.from(JSON.stringify(this.encrypt(payload)), 'utf8')
      .toString('base64');
  }

  async decrypt(encrypted: EncryptedData) {
    const { iv, enc, hmac: h } = encrypted;

    if (!iv || !enc || !h) {
      throw new BadRequestError('Missing IV, HMAC, or encrypted payload');
    }

    if (!(await this.verifyHmacEncrypted(h, iv, enc))) {
      throw new InvalidHmacError();
    }

    const key = this.deriveKeyFromSecret();
    const decipher = crypto.createDecipheriv(this.ENCRYPT_ALGORITHM, key, Buffer.from(iv, 'base64'));
    return decipher.update(enc, 'base64', 'utf8') + decipher.final('utf8');
  }

  async hmac(payload: string) {
    const h = crypto.createHmac('sha256', this.secret);
    h.update(payload);
    return h.digest().toString('hex');
  }

  async hmacEncrypted(iv: string, enc: string) {
    return this.hmac(`${iv}.${enc}`);
  }

  async secureCompare(s1: string, s2: string) {
    return this.secureEquals(s1, s2);
  }

  async verifyHmac(h: string, payload: string) {
    const computedHmac = await this.hmac(payload);
    return this.secureCompare(h, computedHmac);
  }

  async verifyHmacEncrypted(h: string, iv: string, enc: string) {
    const computedHmac = await this.hmacEncrypted(iv, enc);
    return this.secureCompare(h, computedHmac);
  }

  secureRandomBytes(bytes: number = 32) {
    return crypto.randomBytes(bytes);
  }

  secureRandom(bytes: number = 32, encoding: BufferEncoding = 'base64url') {
    return this.secureRandomBytes(bytes).toString(encoding);
  }

  secureEquals(a: string, b: string) {
    if (!a || !b) return false;

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    if (bufferA.length !== bufferB.length) return false;

    return crypto.timingSafeEqual(bufferA, bufferB);
  }

  private deriveKeyFromSecret() {
    return Buffer.from(
      crypto.createHash('sha256')
        .update(this.secret)
        .digest('hex'),
      'hex'
    );
  }

  private generateIv() {
    return this.secureRandomBytes(16);
  }
}
