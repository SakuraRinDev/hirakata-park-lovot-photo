/**
 * 画像処理ユーティリティ
 */

/**
 * File/BlobをBase64文字列に変換
 * @param file 変換するファイル
 * @returns Base64文字列（data URIプレフィックスなし）
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/jpeg;base64, のプレフィックスを除去
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
}

/**
 * 画像をリサイズしてBase64で返す
 * API負荷軽減のため、大きな画像を縮小
 * @param base64 元のBase64画像
 * @param maxSize 最大サイズ（px）
 * @param quality JPEG品質 (0-1)
 * @returns リサイズ後のBase64文字列
 */
export async function resizeImage(
  base64: string,
  maxSize: number = 1024,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // アスペクト比を維持してリサイズ
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Base64で返す（プレフィックスなし）
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl.split(",")[1]);
    };
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

/**
 * Base64画像をBlobに変換
 * @param base64 Base64文字列
 * @param mimeType MIMEタイプ
 * @returns Blob
 */
export function base64ToBlob(base64: string, mimeType: string = "image/png"): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * 画像をダウンロード
 * @param base64 Base64画像データ
 * @param filename ファイル名
 */
export function downloadImage(
  base64: string,
  filename: string = "lovot-photo.png"
): void {
  const link = document.createElement("a");
  link.href = `data:image/png;base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 画像をクリップボードにコピー（Instagram用）
 * @param base64 Base64画像データ
 * @returns 成功したかどうか
 */
export async function copyImageToClipboard(base64: string): Promise<boolean> {
  try {
    const blob = base64ToBlob(base64, "image/png");
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}
