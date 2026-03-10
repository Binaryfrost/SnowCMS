import { isIP, BlockList } from 'net';
import { lookup } from './dns';

interface UnsafeIpBase {
  family: 'ipv4' | 'ipv6'
  ip: string
}

interface UnsafeIpAddr extends UnsafeIpBase {
  type: 'ip'
}

interface UnsafeSubnet extends UnsafeIpBase {
  type: 'cidr',
  prefix: number
}

export type UnsafeIp = UnsafeIpAddr | UnsafeSubnet

const ipBlocklist = new BlockList();
ipBlocklist.addSubnet('127.0.0.0', 8, 'ipv4');
ipBlocklist.addAddress('0.0.0.0', 'ipv4');
ipBlocklist.addAddress('::', 'ipv6');
ipBlocklist.addAddress('::1', 'ipv6');

let ssrfFilterEnabled = false;

interface SafeUrlResult {
  safe: boolean
  hostname?: string
}

export async function isSafeUrl(url: string): Promise<SafeUrlResult> {
  if (!ssrfFilterEnabled) return {
    safe: true
  };

  try {
    const { hostname } = new URL(url);
    const safe = isDomain(hostname) ? await isSafeDomain(hostname) : isSafeIp(hostname);
    return {
      safe,
      hostname
    }
  } catch (_) {
    return {
      safe: false
    };
  }
}

function normalizeIp(ip: string) {
  if (ip.charAt(0) === '[' && ip.charAt(ip.length - 1) === ']') {
    return ip.substring(1, ip.length - 1);
  }

  return ip;
}

function isSafeIp(ip: string) {
  const normalizedIp = normalizeIp(ip);
  const family = isIP(normalizedIp) === 4 ? 'ipv4' : 'ipv6';
  return !ipBlocklist.check(normalizedIp, family);
}

async function isSafeDomain(domain: string) {
  const addresses = await lookup(domain);
  return addresses
    .map((addr) => isSafeIp(addr.address))
    .every(Boolean);
}

function isDomain(hostname: string) {
  return isIP(normalizeIp(hostname)) === 0;
}

export function addToUnsafeIpList(...unsafeIps: UnsafeIp[]) {
  for (const unsafeIp of unsafeIps) {
    const { type, ip, family } = unsafeIp;
    if (type === 'ip') {
      ipBlocklist.addAddress(ip, family);
      console.log(`Added ${family} address ${ip} to SSRF filter`);
    } else {
      ipBlocklist.addSubnet(ip, unsafeIp.prefix, family)
      console.log(`Added ${family} subnet ${ip}/${unsafeIp.prefix} to SSRF filter`);
    }
  }
}

export function init() {
  ssrfFilterEnabled = true;
  test();
}

async function test() {
  const shouldFail = [
    '127.0.0.1',
    '2130706433',
    '017700000001',
    '0x7f000001',
    '0.0.0.0',
    '[::]',
    '[::1]',
    '[0000::1]',
    '[0:0:0:0:0:ffff:127.0.0.1]',
    '[::ffff:127.0.0.1]',
    '127.1',
    '0177.0.0.1',
    '127.255.255.255',
    '127-0-0-1.nip.io',
    '--1.sslip.io',
    '0-0-0-0.sslip.io'
  ].map((ip) => `http://${ip}`);

  const shouldPass = [
    'google.com',
    'example.com',
    '198.51.100.1',
    '[2001:db8::1]'
  ].map((hostname) => `http://${hostname}`);

  const failTestResults = await Promise.all(
    shouldFail.map(async (test) => {
      const { safe, hostname } = await isSafeUrl(test);
      return {
        test,
        safe,
        hostname
      }
    })
  );

  const succeedTestResults = await Promise.all(
    shouldPass.map(async (test) => {
      const { safe, hostname } = await isSafeUrl(test);
      return {
        test,
        safe,
        hostname
      }
    })
  );
  
  const succeedTestPassed = succeedTestResults.every((result) => result.safe);
  const failTestPassed = failTestResults.every((result) => !result.safe);

  if (!succeedTestPassed || !failTestPassed) {
    console.warn(
      'SSRF self-test failed. Disabling to prevent false positives.',
      failTestResults,
      succeedTestResults
    );

    ssrfFilterEnabled = false;
  }
}
