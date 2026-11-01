import React, { useEffect, useState } from 'react';
import OriginalApp from '../../App';
import DeviceInfo from '@/platform/DeviceInfo';

function App() {
  const [info, setInfo] = useState<{
    version: string;
    brand: string;
    model: string;
    battery: number;
  } | null>(null);
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    async function init() {
      // Detect platform
      const isWindows =
        typeof window !== 'undefined' && (window as any).electronAPI?.isWindows === true;
      setPlatform(isWindows ? 'Windows' : 'Android');

      // Get device info
      try {
        const [version, brand, model, battery] = await Promise.all([
          DeviceInfo.getVersion(),
          DeviceInfo.getBrand(),
          DeviceInfo.getModel(),
          DeviceInfo.getBatteryLevel(),
        ]);
        setInfo({ version, brand, model, battery: Math.round(battery * 100) });
      } catch (e) {
        console.error('Failed to get device info:', e);
      }
    }
    init();
  }, []);

  const isWindows =
    typeof window !== 'undefined' && (window as any).electronAPI?.isWindows === true;

  return (
    <div style={{ padding: 20, fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>AniFlix Windows</h1>
      <p>Platform: {platform}</p>
      {info && (
        <div style={{ marginTop: 20, padding: 16, background: '#f0f0f0', borderRadius: 8 }}>
          <p>
            <strong>Version:</strong> {info.version}
          </p>
          <p>
            <strong>Brand:</strong> {info.brand}
          </p>
          <p>
            <strong>Model:</strong> {info.model}
          </p>
          <p>
            <strong>Battery:</strong> {info.battery}%
          </p>
        </div>
      )}
      {isWindows && (
        <div style={{ marginTop: 20 }}>
          <p>Windows-specific features are active.</p>
          <p>Check Electron DevTools console for platform abstraction test results.</p>
        </div>
      )}
      <div style={{ marginTop: 40, color: '#666' }}>
        <p>AniFlix v2.2.0-LTS</p>
        <p>Android + Windows Dual Platform</p>
      </div>
    </div>
  );
}

export default OriginalApp;
