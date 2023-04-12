import { NetInterface } from '#/types';

export function filterIP(ip: NetInterface) {
  return ip.family === 'IPV4' && ip.ip !== '127.0.0.1';
}
