import dns from 'dns';
import QuickLRU from 'quick-lru';

const lru = new QuickLRU<string, dns.LookupAddress[]>({
  // dns.lookup() doesn't return the cache, so cache all lookups for 10 minutes
  maxAge: 10 * 60 * 1000,
  maxSize: 2500
});

/**
 * {@link https://nodejs.org/api/dns.html#dnslookuphostname-options-callback dns.lookup()} uses the
 * operating system's DNS resolver which does cache but the backing API is synchronous despite the
 * method being asynchronous. While
 * {@link https://nodejs.org/api/dns.html#dnsresolvehostname-rrtype-callback dns.resolve()} is fully
 * asynchronous, it does not have a cache and does not take `/etc/hosts` into account, which could
 * have unexpected results. To work around these issues, we wrap `dns.lookup()` with a
 * function that caches the result.
 */
export function lookup(hostname: string) {
  return new Promise<dns.LookupAddress[]>((resolve, reject) => {
    const cached = lru.get(hostname);
    if (cached) return resolve(cached);

    dns.lookup(hostname, {
      all: true
    }, (err, addresses) => {
      if (err) return reject(err);
      lru.set(hostname, addresses);
      resolve(addresses);
    });
  });
}