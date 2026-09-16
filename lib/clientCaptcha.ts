"use client";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
      render: (container: HTMLElement | string, parameters: any) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
  }
}

let scriptLoadingPromise: Promise<boolean> | null = null;

export function loadCaptchaScript(siteKey?: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.grecaptcha?.execute || window.grecaptcha?.render) {
    return Promise.resolve(true);
  }
  if (scriptLoadingPromise) return scriptLoadingPromise;

  const key = siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!key) {
    return Promise.resolve(false);
  }

  scriptLoadingPromise = new Promise((resolve) => {
    const existing = document.querySelector(
      'script[src*="google.com/recaptcha/api.js"]',
    );
    if (existing) {
      if (window.grecaptcha) return resolve(true);
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${key}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Failed to load Google reCAPTCHA script.");
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

export async function executeCaptcha(
  action: string = "cod_checkout",
): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const isDev = process.env.NODE_ENV !== "production";

  if (!siteKey) {
    return isDev ? "dev-bypass-captcha-token" : null;
  }

  try {
    await loadCaptchaScript(siteKey);
  } catch {
    if (isDev) return "dev-bypass-captcha-token";
  }

  const grecaptcha = window.grecaptcha;
  if (!grecaptcha) {
    return isDev ? "dev-bypass-captcha-token" : null;
  }

  return new Promise((resolve) => {
    try {
      grecaptcha.ready(async () => {
        try {
          const token = await grecaptcha.execute(siteKey, { action });
          resolve(token || (isDev ? "dev-bypass-captcha-token" : null));
        } catch (err) {
          console.warn("reCAPTCHA execute notice:", err);
          resolve(isDev ? "dev-bypass-captcha-token" : null);
        }
      });
    } catch (e) {
      console.warn("reCAPTCHA ready callback notice:", e);
      resolve(isDev ? "dev-bypass-captcha-token" : null);
    }
  });
}
