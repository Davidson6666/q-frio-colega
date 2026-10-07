import dns from "node:dns";
import net from "node:net";

/**
 * SSRF protection. The server fetches URLs that third parties typed into Google
 * Maps, so it must never be tricked into reaching loopback, private networks,
 * link-local ranges (cloud metadata at 169.254.169.254) and similar.
 */

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => acc * 256 + Number(part), 0);
}

// [network, prefix length]
const BLOCKED_V4: Array<[string, number]> = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, cloud metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];

function isBlockedV4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  return BLOCKED_V4.some(([network, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return ((value & mask) >>> 0) === ((ipv4ToInt(network) & mask) >>> 0);
  });
}

/** Expands any valid IPv6 text form into 8 numeric 16-bit groups. */
function expandV6(ip: string): number[] | null {
  let address = ip.toLowerCase().split("%")[0];

  // Embedded IPv4 tail (e.g. ::ffff:127.0.0.1) becomes two hex groups.
  const lastColon = address.lastIndexOf(":");
  const tail = address.slice(lastColon + 1);
  if (tail.includes(".")) {
    if (net.isIPv4(tail) === false) return null;
    const v = ipv4ToInt(tail);
    address = `${address.slice(0, lastColon + 1)}${(v >>> 16).toString(16)}:${(v & 0xffff).toString(16)}`;
  }

  const halves = address.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 0) return null;

  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...rest];
  const parsed = groups.map((g) => parseInt(g, 16));
  return parsed.length === 8 && parsed.every((n) => Number.isInteger(n) && n >= 0 && n <= 0xffff)
    ? parsed
    : null;
}

function isBlockedV6(ip: string): boolean {
  const groups = expandV6(ip);
  if (!groups) return true; // unparseable: refuse rather than guess

  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible forms inherit the v4 verdict.
  const firstFiveZero = groups.slice(0, 5).every((g) => g === 0);
  if (firstFiveZero && (groups[5] === 0xffff || groups[5] === 0)) {
    const v4 = `${groups[6] >>> 8}.${groups[6] & 255}.${groups[7] >>> 8}.${groups[7] & 255}`;
    // "::" and "::1" fall here too (v4 0.0.0.0 and 0.0.0.1 are blocked).
    return isBlockedV4(v4);
  }

  const first = groups[0];
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (first === 0x0064 && groups[1] === 0xff9b) return true; // 64:ff9b::/96 NAT64
  return false;
}

/** True when the address must not be fetched. Non-IP input is blocked too. */
export function isPrivateAddress(address: string): boolean {
  const host = address.replace(/^\[|\]$/g, "");
  if (net.isIPv4(host)) return isBlockedV4(host);
  if (net.isIPv6(host)) return isBlockedV6(host);
  return true;
}

/**
 * `lookup` for http(s).request. Resolving and validating inside the connection
 * itself (not in a separate earlier step) also defeats DNS rebinding: the IP we
 * check is the IP we connect to.
 */
export const safeLookup = ((hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "", 0);

    const list = addresses as unknown as dns.LookupAddress[];
    if (list.length === 0 || list.some((entry) => isPrivateAddress(entry.address))) {
      const blocked = Object.assign(new Error("Blocked address"), { code: "EBLOCKED" });
      return callback(blocked as NodeJS.ErrnoException, "", 0);
    }

    if (options.all) {
      return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, list);
    }
    return callback(null, list[0].address, list[0].family);
  });
}) as net.LookupFunction;
