import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { QRCodeSVG } from 'qrcode.react';
import copy from 'copy-to-clipboard';
import { shell } from '@tauri-apps/api';
import Icon from '@meowtec/lansend-shared/components/icon';
import IC_DONE from '#/assets/icons/done.svg';
import IC_DOWN from '#/assets/icons/expand-down.svg';
import { invokes } from './bridge/invoke';
import { useDelaySwitch } from './utils/use-delay-switch';
import { safeLocalStorage } from './utils/storage';
import { useLocalIpList } from './utils/use-available-ip';

const FORM_VALUE_STORAGE_KEY = 'form-value';

const portInputId = 'port-input';
const ipInputId = 'ip-input';

interface FormValue {
  port: string;
  ip: string;
}

function App() {
  const [formValue, setFormValue] = useState<FormValue>(() => ({
    port: '17133',
    ip: '',
    ...safeLocalStorage.get(FORM_VALUE_STORAGE_KEY),
  }));
  const [processing, setIsProcessing] = useState(false);
  const { data: isRunning, mutate: mutateIsRunning } = useSWR('tauri:is_running', () => invokes.is_running(), {
    refreshInterval: 1000,
  });
  const [copied, setCopied] = useDelaySwitch(1000);

  const ipList = useLocalIpList(formValue.port, isRunning ?? false);

  const { ip, port } = formValue;
  const numberPort = Number(port);

  const setIp = (newIp: string) => setFormValue((prev) => ({ ...prev, ip: newIp }));

  const setPort = (newPort: string) => setFormValue((prev) => ({ ...prev, port: newPort }));

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
    // if ip is empty or not available, set it to the first available ip
    if (!ipList?.length) return;

    if (
      !ip
      || !ipList.some((item) => item.ip === ip)
    ) {
      setIp(ipList[0].ip);
    }
  }, [ip, ipList]);

  useEffect(() => {
    safeLocalStorage.set(FORM_VALUE_STORAGE_KEY, formValue);
  }, [formValue]);

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
            <div className="select">
              {ip || 'Select IP'}
              <Icon className="select-arrow" name={IC_DOWN} />
              <select
                id={ipInputId}
                value={ip}
                placeholder="Select IP"
                onChange={(e) => setIp(e.target.value)}
              >
                <option value="" disabled>Select IP</option>
                {ipList?.map((item) => (
                  <option value={item.ip}>
                    {item.ip}
                  </option>
                ))}
              </select>
            </div>
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
