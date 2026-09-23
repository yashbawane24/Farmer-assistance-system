// IndexedDB Local Storage Manager for Offline PWA Operations

const DB_NAME = 'SFAS_Offline_Store';
const DB_VERSION = 1;
const STORE_SCANS = 'offline_disease_scans';
const STORE_QUEUE = 'sync_queue';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_SCANS)) {
        db.createObjectStore(STORE_SCANS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineStorage = {
  async saveScan(scanData) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SCANS, STORE_QUEUE], 'readwrite');
      const scanStore = tx.objectStore(STORE_SCANS);
      const queueStore = tx.objectStore(STORE_QUEUE);

      const record = {
        ...scanData,
        savedOfflineAt: new Date().toISOString(),
        synced: false
      };

      const scanReq = scanStore.add(record);
      scanReq.onsuccess = () => {
        queueStore.add({ action: 'SYNC_DISEASE_SCAN', scanId: scanReq.result, payload: record });
      };

      tx.oncomplete = () => resolve(record);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getOfflineScans() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SCANS, 'readonly');
      const store = tx.objectStore(STORE_SCANS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async getPendingQueue() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_QUEUE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async clearQueue() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      tx.objectStore(STORE_QUEUE).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
};
