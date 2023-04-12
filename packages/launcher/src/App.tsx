import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { QRCodeSVG } from 'qrcode.react';
import copy from 'copy-to-clipboard';
import { shell } from '@tauri-apps/api';
import Icon from '@meowtec/lansend-shared/components/icon';
import IC_DONE from '#/assets/icons/done.svg';
import { invokes } from './bridge/invoke';
import { filterIP } from './utils/ip';
import { useDelaySwitch } from './utils/use-delay-switch';

const portInputId = 'port-input';
const ipInputId = 'ip-input';

function App() {
  const [port, setPort] = useState('17133');
  const [processing, setIsProcessing] = useState(false);
  const { data: isRunning, mutate: mutateIsRunning } = useSWR('tauri:is_running', () => invokes.is_running(), {
    refreshInterval: 1000,
  });
  const [ip, setIp] = useState('');
  const [copied, setCopied] = useDelaySwitch(1000);

  const { data: networkInterfaces } = useSWR('tauri:network_interfaces', () => invokes.get_netifas().then((list) => list.filter(filterIP)));

  const numberPort = Number(port);

  const portValid = useMemo(() => Number.isInteger(numberPort) && numberPort >= 1024 && numberPort <= 65535, [numberPort]);

  const address = ip ? `http://${ip}:${port}` : '';

  const handleStartClick = async () => {
    if (portValid) {
      try {
        setIsProcessing(true);
        await invokes.start_server({ port: numberPort });
        await mutateIsRunning(true);
      } catch (err) {
        console.error(err);
        alert(`Failed to start server, reason: ${String(err)}` || 'unknown');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleStopClick = async () => {
    try {
      setIsProcessing(true);
      await invokes.stop_server();
      await mutateIsRunning(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddressClick = (e: React.MouseEvent) => {
    e.preventDefault();
    void shell.open(address);
  };

  useEffect(() => {
    // if ip is empty, set it to the first ip
    if (!ip && networkInterfaces?.length) {
      setIp(networkInterfaces[0].ip);
    }
  }, [ip, networkInterfaces]);

  return (
    <div className="container">
      <div className="group-header">Start server</div>
      <div className="form-group">
        <div className="form-item">
          <label
            htmlFor={portInputId}
          >
            <div className="form-label">PORT</div>
            <input
              id={portInputId}
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value.trim())}
            />
          </label>

          <button
            type="button"
            disabled={!portValid || processing}
            className="form-button"
            onClick={isRunning ? handleStopClick : handleStartClick}
          >
            {isRunning ? 'stop' : 'start'}
          </button>
        </div>

        <div className="form-item">
          <label htmlFor={ipInputId}>
            <div className="form-label">IP</div>
            <select
              id={ipInputId}
              value={ip}
              className="address__ip"
              placeholder="Select one address"
              onChange={(e) => setIp(e.target.value)}
            >
              <option value="" disabled>Select address</option>
              {networkInterfaces?.map((item) => (
                <option value={item.ip}>
                  {item.ip}
                </option>
              ))}
            </select>
          </label>

        </div>
      </div>

      {ip ? (
        <div className={isRunning ? '' : 'disabled'}>
          <div className="address">
            <a href={address} onClick={handleAddressClick}>{address}</a>
            <button
              type="button"
              className="form-button plain"
              onClick={() => {
                if (copy(address)) {
                  setCopied();
                }
              }}
            >
              Copy
              <div className={clsx('button-mask', copied && 'show')}>
                <Icon name={IC_DONE} />
              </div>
            </button>
          </div>
          <div className="qrcode">
            <QRCodeSVG
              value={address}
              size={180}
              level="H"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
