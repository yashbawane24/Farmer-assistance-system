import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { offlineStorage } from '../services/offlineStorage.js';

export function OfflineBadge({ lang = 'en' }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkPendingQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPendingQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingQueue = async () => {
    try {
      const queue = await offlineStorage.getPendingQueue();
      setPendingCount(queue.length);
    } catch (e) {
      // Ignore if indexedDB not ready
    }
  };

  if (isOnline && pendingCount === 0) {
    return null;
  }

  const offlineText = lang === 'mr'
    ? 'ऑफलाइन मोड सक्रिय — स्थानिक एज एआय सुरू आहे. इंटरनेट सुरू झाल्यावर माहिती सिंक होईल.'
    : lang === 'hi'
    ? 'ऑफलाइन मोड सक्रिय — मोबाइल में लोकल एज एआई चल रहा है। इंटरनेट आने पर डेटा सिंक होगा।'
    : 'Offline Mode Active — Running local Edge AI on this phone. Scans will sync when connected.';

  const syncedText = lang === 'mr'
    ? `इंटरनेट कनेक्ट झाले. ${pendingCount} ऑफलाइन नोंदी सर्व्हरशी सिंक झाल्या.`
    : lang === 'hi'
    ? `इंटरनेट कनेक्ट हुआ। ${pendingCount} ऑफलाइन रिकॉर्ड सर्वर से सिंक हुए।`
    : `Connected. ${pendingCount} offline action(s) synced with server.`;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      {!isOnline ? (
        <>
          <WifiOff size={16} />
          <span>{offlineText}</span>
        </>
      ) : (
        <>
          <RefreshCw size={16} className="spin" />
          <span>{syncedText}</span>
        </>
      )}
    </div>
  );
}

export function OfflineIndicatorPill({ lang = 'en' }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const liveText = lang === 'mr' ? 'थेट माहिती' : lang === 'hi' ? 'लाइव डेटा' : 'Live Data';
  const offlineText = lang === 'mr' ? 'ऑफलाइन एज' : lang === 'hi' ? 'ऑफलाइन एज' : 'Offline Edge';

  return (
    <div className={`offline-badge-pill ${!isOnline ? 'offline' : ''}`}>
      {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
      <span>{isOnline ? liveText : offlineText}</span>
    </div>
  );
}
