"use client";

export type StorageData = {
  rows: {
    id: string;
    name: string;
    price: string;
    packQty: string;
    need: string;
  }[];
  overheadPct: string;
  laborPct: string;
  packagingCost: string;
  yieldCount: string;
  sellPriceBatch: string;
  targetMargin: string;
  whMarkup: string;
  rtMarkup: string;
};

export type SavedRecord = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt?: number;
  data: StorageData;
};

const DB_NAME = "recipe-costing-db";
const STORE = "saves";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveData(
  name: string,
  data: StorageData
): Promise<SavedRecord> {
  const db = await openDB();
  const record: SavedRecord = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()),
    name,
    createdAt: Date.now(),
    data,
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
  return record;
}

export async function updateSave(
  id: string,
  data: StorageData,
  name?: string
): Promise<SavedRecord> {
  const db = await openDB();

  const record = await new Promise<SavedRecord>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as SavedRecord | undefined;
      const updated: SavedRecord = existing
        ? {
            ...existing,
            data,
            name: name ?? existing.name,
            updatedAt: Date.now(),
          }
        : { id, name: name ?? "Untitled", data, createdAt: Date.now() };
      store.put(updated);
      tx.oncomplete = () => resolve(updated);
      tx.onerror = () => reject(tx.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });

  db.close();
  return record;
}

export async function listSaves(): Promise<SavedRecord[]> {
  const db = await openDB();
  const results = await new Promise<SavedRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result as SavedRecord[]).sort(
        (a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)
      );
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
  db.close();
  return results;
}

export async function deleteSave(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getSave(id: string): Promise<SavedRecord | undefined> {
  const db = await openDB();
  const record = await new Promise<SavedRecord | undefined>(
    (resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as SavedRecord | undefined);
      req.onerror = () => reject(req.error);
    }
  );
  db.close();
  return record;
}
