export {};

declare global {
  interface Window {
    fawaterkCheckout?: (config: FawaterakPluginConfig) => void;
  }
}

export type FawaterakPluginConfig = {
  envType: "test" | "live";
  hashKey: string;
  token?: string;
  style?: { listing?: string };
  version?: string;
  lang?: string;
  redirectOutIframe?: boolean;
  requestBody: Record<string, unknown>;
};
