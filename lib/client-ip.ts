import { isIP } from 'node:net';

export function getClientIp(request: Request): string | null {
  const header = process.env.TRUSTED_IP_HEADER;
  const ip = header ? request.headers.get(header)?.trim().toLowerCase() : undefined;
  return ip && isIP(ip) ? ip : null;
}
