// IndexedDBを使用した画像保存ユーティリティ

export interface SavedImage {
  id: string;
  imageData: string; // Base64
  model: string;
  modelName: string;
  createdAt: Date;
  originalImage?: string; // 元のLovot画像（オプション）
}

const DB_NAME = "hirakata-park-lovot";
const DB_VERSION = 1;
const STORE_NAME = "generated-images";

// データベース接続を取得
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("model", "model", { unique: false });
      }
    };
  });
}

// 画像を保存
export async function saveImage(data: Omit<SavedImage, "id" | "createdAt">): Promise<SavedImage> {
  const db = await openDB();

  const image: SavedImage = {
    ...data,
    id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(image);

    request.onsuccess = () => resolve(image);
    request.onerror = () => reject(request.error);
  });
}

// 全ての画像を取得（新しい順）
export async function getAllImages(): Promise<SavedImage[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("createdAt");
    const request = index.openCursor(null, "prev"); // 新しい順

    const images: SavedImage[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        images.push(cursor.value);
        cursor.continue();
      } else {
        resolve(images);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

// 画像を削除
export async function deleteImage(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 全ての画像を削除
export async function clearAllImages(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 画像の数を取得
export async function getImageCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// モデル名のマッピング
export const MODEL_NAMES: Record<string, string> = {
  "flux-2-max": "FLUX.2 Max",
  "riverflow-v2-max": "Riverflow V2 Max",
  "gemini-3-pro": "Gemini 3 Pro Image",
  "gpt-5-image": "GPT-5 Image",
  "seedream-4.5": "Seedream 4.5",
};
