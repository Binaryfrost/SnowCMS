import { isIP, BlockList } from 'net';
import SecurityConfigProvider from '../config/SecurityConfigProvider';
import Service from '../Service';
import { UnsafeIpFunction } from '../../ssrf';
import { lookup } from '../../dns';

const DEFAULT_BLOCKLIST = [{
  type: 'cidr',
  ip: '127.0.0.0',
  prefix: 8,
  family: 'ipv4'
}, {
  type: 'ip',
  ip: '0.0.0.0',
  family: 'ipv4'
}, {
  type: 'ip',
  ip: '::',
  family: 'ipv6'
}, {
  type: 'ip',
  ip: '::1',
  family: 'ipv6'
}];

export default class SecurityService extends Service {
  private securityConfigProvider: SecurityConfigProvider | null;
  private ipBlocklist = new BlockList();
  private unsafeIpFunctions: UnsafeIpFunction[] = [];

  constructor(securityConfigProvider: SecurityConfigProvider | null) {
    super();
    this.securityConfigProvider = securityConfigProvider;

    const ssrfIps = securityConfigProvider?.getSsrfIps() || DEFAULT_BLOCKLIST;

    ssrfIps.forEach((ip) => {
      if (typeof ip === 'function') {
        this.unsafeIpFunctions.push(ip);
      } else if (ip.type === 'ip') {
        this.ipBlocklist.addAddress(ip.ip, ip.family);
      } else {
        this.ipBlocklist.addSubnet(ip.ip, ip.prefix, ip.family);
      }
    });
  }

  async shouldBlockUrl(url: string) {
    if (this.securityConfigProvider && !this.securityConfigProvider.isSsrfEnabled()) {
      return {
        safe: true
      };
    }

    try {
      const { hostname } = new URL(url);
      const safe = this.isDomain(hostname) ?
        await this.isSafeDomain(hostname) : this.isSafeIp(hostname);
      return {
        safe,
        hostname
      };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return {
        safe: false
      };
    }
  }

  private normalizeIp(ip: string) {
    if (ip.charAt(0) === '[' && ip.charAt(ip.length - 1) === ']') {
      return ip.substring(1, ip.length - 1);
    }

    return ip;
  }

  private isSafeIp(ip: string) {
    const normalizedIp = this.normalizeIp(ip);
    const family = isIP(normalizedIp) === 4 ? 'ipv4' : 'ipv6';
    const safe = !this.ipBlocklist.check(normalizedIp, family);
    if (!safe) return false;
    return this.unsafeIpFunctions.every((fn) => !fn(normalizedIp));
  }

  private async isSafeDomain(domain: string) {
    const addresses = await lookup(domain);
    return addresses
      .map((addr) => this.isSafeIp(addr.address))
      .every(Boolean);
  }

  private isDomain(hostname: string) {
    return isIP(this.normalizeIp(hostname)) === 0;
  }
}
