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
let scriptLoadFailed = false;

/**
 * Loads the Google reCAPTCHA v3 script with dual-mirror fallback (google.com -> recaptcha.net).
 * Gracefully handles ad-blockers, offline network states, and prevents unhandled console errors.
 */
export function loadCaptchaScript(siteKey?: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.grecaptcha?.execute || window.grecaptcha?.render) {
    return Promise.resolve(true);
  }
  if (scriptLoadingPromise && !scriptLoadFailed) return scriptLoadingPromise;

  const key = siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!key) {
    return Promise.resolve(false);
  }

  const tryLoadScript = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        script.remove();
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  scriptLoadingPromise = (async () => {
    try {
      // 1. Check if script is already present in DOM
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src*="recaptcha/api.js"]',
      );
      if (existing) {
        if (window.grecaptcha) return true;
        return new Promise<boolean>((resolve) => {
          existing.addEventListener("load", () => resolve(true), { once: true });
          existing.addEventListener("error", () => resolve(false), { once: true });
          setTimeout(() => resolve(!!window.grecaptcha), 3000);
        });
      }

      // 2. Try primary Google reCAPTCHA endpoint
      const primaryLoaded = await tryLoadScript(
        `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(key)}`,
      );
      if (primaryLoaded && window.grecaptcha) {
        scriptLoadFailed = false;
        return true;
      }

      // 3. Fallback to official Google mirror (recaptcha.net) for regions/adblockers blocking google.com
      const fallbackLoaded = await tryLoadScript(
        `https://www.recaptcha.net/recaptcha/api.js?render=${encodeURIComponent(key)}`,
      );
      if (fallbackLoaded && window.grecaptcha) {
        scriptLoadFailed = false;
        return true;
      }

      // If both mirrors fail (e.g. strict ad-blocker or offline), fail gracefully
      scriptLoadFailed = true;
      return false;
    } catch {
      scriptLoadFailed = true;
      return false;
    }
  })();

  return scriptLoadingPromise;
}

/**
 * Safely executes reCAPTCHA action or falls back to development/ad-block bypass token.
 */
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
    const loaded = await loadCaptchaScript(siteKey);
    if (!loaded) {
      return isDev ? "dev-bypass-captcha-token" : null;
    }
  } catch {
    return isDev ? "dev-bypass-captcha-token" : null;
  }

  const grecaptcha = window.grecaptcha;
  if (!grecaptcha || typeof grecaptcha.ready !== "function") {
    return isDev ? "dev-bypass-captcha-token" : null;
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(isDev ? "dev-bypass-captcha-token" : null);
    }, 4000);

    try {
      grecaptcha.ready(async () => {
        try {
          if (typeof grecaptcha.execute === "function") {
            const token = await grecaptcha.execute(siteKey, { action });
            clearTimeout(timer);
            resolve(token || (isDev ? "dev-bypass-captcha-token" : null));
          } else {
            clearTimeout(timer);
            resolve(isDev ? "dev-bypass-captcha-token" : null);
          }
        } catch {
          clearTimeout(timer);
          resolve(isDev ? "dev-bypass-captcha-token" : null);
        }
      });
    } catch {
      clearTimeout(timer);
      resolve(isDev ? "dev-bypass-captcha-token" : null);
    }
  });
}
