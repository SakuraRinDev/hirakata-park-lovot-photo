/**
 * デバッグユーティリティ
 * URLパラメータ ?debug=true でデバッグモードを有効化
 */

export interface DebugLog {
  timestamp: string;
  type: "info" | "error" | "warning" | "success";
  message: string;
  data?: any;
}

class DebugManager {
  private logs: DebugLog[] = [];
  private enabled: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      this.enabled = params.get("debug") === "true";
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  log(type: DebugLog["type"], message: string, data?: any) {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    };

    this.logs.push(log);

    if (this.enabled) {
      const style = this.getConsoleStyle(type);
      console.log(`%c[DEBUG ${type.toUpperCase()}]%c ${message}`, style, "", data || "");
    }
  }

  info(message: string, data?: any) {
    this.log("info", message, data);
  }

  error(message: string, data?: any) {
    this.log("error", message, data);
  }

  warning(message: string, data?: any) {
    this.log("warning", message, data);
  }

  success(message: string, data?: any) {
    this.log("success", message, data);
  }

  getLogs(): DebugLog[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  private getConsoleStyle(type: DebugLog["type"]): string {
    const styles = {
      info: "color: #3b82f6; font-weight: bold",
      error: "color: #ef4444; font-weight: bold",
      warning: "color: #f59e0b; font-weight: bold",
      success: "color: #10b981; font-weight: bold",
    };
    return styles[type];
  }

  // 画像情報を取得
  async getImageInfo(base64: string): Promise<{
    size: number;
    dimensions: { width: number; height: number };
    format: string;
  }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          size: Math.round((base64.length * 3) / 4), // Base64のバイト数を概算
          dimensions: { width: img.width, height: img.height },
          format: "JPEG",
        });
      };
      img.src = `data:image/jpeg;base64,${base64}`;
    });
  }
}

export const debug = new DebugManager();
