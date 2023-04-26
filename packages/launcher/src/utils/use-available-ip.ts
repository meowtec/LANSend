import { invokes } from '#/bridge/invoke';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { filterIP } from './ip';

/**
 * detect if the ip is available by sending a request to the server.
 */
const isIpAvailable = (ip: string, port: number | string) => fetch(`http://${ip}:${port}/api/ping`, {
  credentials: 'omit',
}).then(() => true).catch(() => false);

/**
 * cache the result or promise<result> of isIpAvailable.
 * - if the result is true, cache the result.
 * - if the result is pending, cache the promise.
 */
const ipAvailableCache = new Map<string, true | Promise<boolean>>();

/**
 * cached version of isIpAvailable.
 * Only cache when the result is true or the check is pending.
 */
const isIpAvailableCached = async (ip: string, port: number | string): Promise<boolean> => {
  const cached = ipAvailableCache.get(ip);
  if (cached) {
    return cached;
  }

  const promise = isIpAvailable(ip, port).then((isAvailable) => {
    if (isAvailable) {
      ipAvailableCache.set(ip, true);
    } else {
      ipAvailableCache.delete(ip);
    }
    return isAvailable;
  });

  ipAvailableCache.set(ip, promise);

  return promise;
};

export function useLocalIpList(port: number | string, isRunning: boolean) {
  const { data: networkInterfaces } = useSWR(
    'tauri:network_interfaces',
    () => invokes.get_netifas().then((list) => list.filter(filterIP)),
  );
  const ipList = useMemo(() => networkInterfaces?.map((item) => item.ip) ?? [], [networkInterfaces]);

  const [availableSet, setAvailableSet] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    void Promise.all(ipList.map((ip) => isIpAvailableCached(ip, port))).then((isAvailableList) => {
      const availableList = ipList.filter((_, index) => isAvailableList[index]);
      setAvailableSet(new Set(availableList));
    });
  }, [ipList, port, isRunning]);

  return useMemo(() => networkInterfaces?.filter(
    (ifa) => (availableSet ? availableSet.has(ifa.ip) : true),
  ), [availableSet, networkInterfaces]);
}
