const VDOCIPHER_API_BASE = "https://dev.vdocipher.com/api";

export type VdoCipherClientPayload = {
  policy: string;
  key: string;
  "x-amz-signature": string;
  "x-amz-algorithm": string;
  "x-amz-date": string;
  "x-amz-credential": string;
  uploadLink: string;
};

export type VdoCipherUploadCredentials = {
  videoId: string;
  clientPayload: VdoCipherClientPayload;
};

export type VdoCipherVideoStatus =
  | "PRE-Upload"
  | "Queued"
  | "Processing"
  | "ready"
  | "Failed"
  | string;

export type VdoCipherVideoDetails = {
  id: string;
  title?: string;
  status: VdoCipherVideoStatus;
  length?: number;
};

export type CopyrightOverlayStyle = "floating" | "watermark";

function getApiSecret(): string | null {
  const key =
    process.env.VDOCIPHER_API_KEY?.trim() ||
    process.env.vdocipher_api_key?.trim() ||
    "";
  return key || null;
}

export function isVdoCipherConfigured(): boolean {
  return !!getApiSecret();
}

/** Short looped video in VdoCipher used to keep Widevine active for students site-wide. */
export function getDrmSentinelVideoId(): string | null {
  const id =
    process.env.VDOCIPHER_DRM_SENTINEL_VIDEO_ID?.trim() ||
    process.env.vdocipher_drm_sentinel_video_id?.trim() ||
    "";
  return id || null;
}

export function isDrmSentinelConfigured(): boolean {
  return isVdoCipherConfigured() && !!getDrmSentinelVideoId();
}

/** Custom player theme ID from the VdoCipher dashboard (Custom Player section). */
export function getVdoCipherPlayerId(): string | null {
  const id =
    process.env.VDOCIPHER_PLAYER_ID?.trim() ||
    process.env.vdocipher_player_id?.trim() ||
    "";
  return id || null;
}

/** Include in OTP API responses so the client can build the iframe URL. */
export function getVdoCipherPlayerIdForClient(): { playerId?: string } {
  const playerId = getVdoCipherPlayerId();
  return playerId ? { playerId } : {};
}

/** OTP lifetime for the hidden DRM sentinel player (seconds). */
export const DRM_SENTINEL_OTP_TTL_SECONDS = 300;

/** Request the next OTP this many seconds before the current one expires. */
export const DRM_SENTINEL_OTP_REFRESH_LEAD_SECONDS = 30;

export function getDrmSentinelOtpRefreshIntervalMs(): number {
  return (
    (DRM_SENTINEL_OTP_TTL_SECONDS - DRM_SENTINEL_OTP_REFRESH_LEAD_SECONDS) * 1000
  );
}

export function buildVdoCipherPlayerSrc(
  otp: string,
  playbackInfo: string,
  options?: {
    autoplay?: boolean;
    loop?: boolean;
    controls?: "on" | "off" | "native";
    playerId?: string | null;
  },
): string {
  const params = new URLSearchParams({ otp, playbackInfo });
  if (options?.autoplay) params.set("autoplay", "true");
  if (options?.loop) params.set("loop", "true");
  if (options?.controls) params.set("controls", options.controls);
  const playerId = options?.playerId?.trim();
  if (playerId) params.set("playerId", playerId);
  return `https://player.vdocipher.com/v2/?${params.toString()}`;
}

function authHeaders(): HeadersInit {
  const secret = getApiSecret();
  if (!secret) throw new Error("VdoCipher API key is not configured");
  return {
    Authorization: `Apisecret ${secret}`,
    Accept: "application/json",
  };
}

async function parseVdoCipherError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string; error?: string };
    return data.message || data.error || res.statusText;
  } catch {
    return res.statusText || "VdoCipher request failed";
  }
}

export async function getUploadCredentials(
  title: string,
  folderId?: string,
): Promise<VdoCipherUploadCredentials> {
  const safeTitle = title.trim() || "Untitled lesson video";
  const params = new URLSearchParams({ title: safeTitle });
  if (folderId?.trim()) params.set("folderId", folderId.trim());

  const res = await fetch(`${VDOCIPHER_API_BASE}/videos?${params.toString()}`, {
    method: "PUT",
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(await parseVdoCipherError(res));
  }

  const data = (await res.json()) as {
    videoId?: string;
    clientPayload?: VdoCipherClientPayload;
  };

  const videoId = data.videoId?.trim();
  const clientPayload = data.clientPayload;
  if (!videoId || !clientPayload?.uploadLink) {
    throw new Error("Invalid upload credentials response from VdoCipher");
  }

  return { videoId, clientPayload };
}

export async function getVideoStatus(videoId: string): Promise<VdoCipherVideoDetails> {
  const id = videoId.trim();
  const res = await fetch(`${VDOCIPHER_API_BASE}/videos/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(await parseVdoCipherError(res));
  }

  const data = (await res.json()) as VdoCipherVideoDetails;
  return {
    id: data.id || id,
    title: data.title,
    status: data.status ?? "Processing",
    length: data.length,
  };
}

export function buildWatermarkAnnotate(
  copyrightCode: string,
  style: CopyrightOverlayStyle = "floating",
): string {
  const text = copyrightCode.trim();
  if (!text) return "[]";

  if (style === "watermark") {
    return JSON.stringify([
      {
        type: "text",
        text,
        x: "10",
        y: "10",
        alpha: "0.15",
        color: "0xFFFFFF",
        size: "48",
      },
    ]);
  }

  return JSON.stringify([
    {
      type: "rtext",
      text,
      alpha: "0.60",
      color: "0xFFFFFF",
      size: "15",
      interval: "5000",
    },
  ]);
}

export async function generatePlaybackOtp(
  videoId: string,
  options?: {
    copyrightCode?: string | null;
    copyrightOverlayStyle?: CopyrightOverlayStyle;
    ttl?: number;
  },
): Promise<{ otp: string; playbackInfo: string }> {
  const id = videoId.trim();
  const body: Record<string, unknown> = {};

  if (options?.ttl && options.ttl > 0) {
    body.ttl = options.ttl;
  }

  const code = options?.copyrightCode?.trim();
  if (code) {
    body.annotate = buildWatermarkAnnotate(
      code,
      options?.copyrightOverlayStyle ?? "floating",
    );
  }

  const res = await fetch(`${VDOCIPHER_API_BASE}/videos/${encodeURIComponent(id)}/otp`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await parseVdoCipherError(res));
  }

  const data = (await res.json()) as { otp?: string; playbackInfo?: string };
  if (!data.otp || !data.playbackInfo) {
    throw new Error("Invalid OTP response from VdoCipher");
  }

  return { otp: data.otp, playbackInfo: data.playbackInfo };
}
