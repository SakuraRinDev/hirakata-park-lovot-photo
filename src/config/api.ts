// API プロバイダー設定

export type ApiProvider = "gemini" | "openrouter";

export interface ApiConfig {
  provider: ApiProvider;
  endpoint: string;
  name: string;
  description: string;
}

export const API_CONFIGS: Record<ApiProvider, ApiConfig> = {
  gemini: {
    provider: "gemini",
    endpoint: "/api/generate-poster",
    name: "Gemini 3 Pro",
    description: "Google Gemini 3 Pro Image API（推奨）",
  },
  openrouter: {
    provider: "openrouter",
    endpoint: "/api/generate-poster-openrouter",
    name: "OpenRouter",
    description: "OpenRouter経由でGemini 3 Pro Image",
  },
};

// =============================================
// ここで使用するAPIを手動で切り替えてください
// =============================================
export const CURRENT_API_PROVIDER: ApiProvider = "openrouter";
// "gemini" または "openrouter" を設定

// 現在の設定を取得
export function getCurrentApiConfig(): ApiConfig {
  return API_CONFIGS[CURRENT_API_PROVIDER];
}

// エンドポイントを取得
export function getApiEndpoint(): string {
  return getCurrentApiConfig().endpoint;
}
