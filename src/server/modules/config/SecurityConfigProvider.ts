import { SecurityConfig } from '../../../config';
import { UnsafeIp } from '../../ssrf';
import ConfigProvider from './ConfigProvider';

const DEFAULT_BLOCKLIST: UnsafeIp[] = [{
  type: 'cidr',
  ip: '127.0.0.1',
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

export default class SecurityConfigProvider extends ConfigProvider {
  private ssrfEnabled: boolean;
  private ssrfIps: UnsafeIp[];

  /*
   * TODO: When switching to the ConfigProvider, remove external SSRF initialization code
   * (e.g. initConfig in config.ts) and pass IPs to this provider. Provider should be
   * used in SecurityService to keep business logic separate.
   */
  constructor(config: SecurityConfig) {
    super('security');

    const ssrf = config.ssrf ? this.validator(config.ssrf, 'ssrf')
      .object()
      .of({
        enabled: (value, name) => this.validator(value, name)
          .required().boolean(),
        additional: (value, name) => this.validator(value, name)
          // TODO: Update validator to support union types then implement type checking in array
          .array().of(
            (elem, n) => {
              if (typeof elem !== 'function') {
                if (elem.type === 'ip') {
                  return this.validator(elem, n).required()
                    .object().of({
                      type: (v, n1) => this.validator(v, n1).required().string(),
                      family: (v, n1) => this.validator(v, n1).required().union([
                        'ipv4', 'ipv6'
                      ]),
                      ip: (v, n1) => this.validator(v, n1).required().string()
                    });
                }

                if (elem.type === 'cidr') {
                  return this.validator(elem, n).required().object().of({
                    type: (v, n1) => this.validator(v, n1).required().string(),
                    family: (v, n1) => this.validator(v, n1).required().union([
                      'ipv4', 'ipv6'
                    ]),
                    ip: (v, n1) => this.validator(v, n1).required().string(),
                    prefix: (v, n1) => this.validator(v, n1).required().number()
                  });
                }

                return this.validator(elem, n).required().error('UnsafeIp');
              }
              return this.validator(elem, n).required().noop();
            }
          )
      }).getValue() : null;

    this.ssrfEnabled = ssrf?.enabled ?? true;
    this.ssrfIps = [
      ...DEFAULT_BLOCKLIST,
      ...ssrf?.additional ?? []
    ];
  }

  isSsrfEnabled() {
    return this.ssrfEnabled;
  }

  getSsrfIps() {
    return this.ssrfIps;
  }
}
