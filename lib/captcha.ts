interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export async function verifyRecaptcha(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<{ success: boolean; reason?: string }> {
  const isDev = process.env.NODE_ENV !== "production";
  const isLocalIp =
    remoteIp === "127.0.0.1" ||
    remoteIp === "::1" ||
    remoteIp === "localhost" ||
    !remoteIp;

  // Allow development bypass tokens or development fallback
  if (isDev && (!token || token.startsWith("dev-") || isLocalIp)) {
    console.log(
      "[Captcha] Development mode / local request detected. Permitting order creation.",
    );
    return { success: true };
  }

  const secretKey =
    process.env.RECAPTCHA_SECRET_KEY ||
    process.env.RECAPTCHA_SECRET ||
    process.env.NEXT_PUBLIC_RECAPTCHA_SECRET;

  if (!secretKey) {
    if (isDev) {
      console.warn(
        "[Captcha] RECAPTCHA_SECRET_KEY not set. Allowing in development mode.",
      );
      return { success: true };
    }
    console.error("[Captcha] RECAPTCHA_SECRET_KEY is missing in production.");
    return { success: false, reason: "reCAPTCHA is not configured on the server." };
  }

  if (!token) {
    return { success: false, reason: "Missing captcha verification token." };
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", secretKey);
    params.append("response", token);
    if (remoteIp && !isLocalIp) {
      params.append("remoteip", remoteIp);
    }

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      if (isDev) {
        console.warn("[Captcha] Google service unreachable in dev mode. Permitting.");
        return { success: true };
      }
      return { success: false, reason: "Google verification service unreachable." };
    }

    const data: RecaptchaVerifyResponse = await res.json();

    if (!data.success) {
      const errors = data["error-codes"]?.join(", ") || "Verification rejected by Google reCAPTCHA.";
      if (isDev) {
        console.warn(
          `[Captcha] Google rejected token in development mode (${errors}). Permitting for local testing.`,
        );
        return { success: true };
      }
      return { success: false, reason: errors };
    }

    // For reCAPTCHA v3, verify score (>= 0.5 is genuine human interaction)
    if (typeof data.score === "number" && data.score < 0.5) {
      if (isDev) {
        console.warn(`[Captcha] Low score (${data.score}) in dev mode. Permitting.`);
        return { success: true };
      }
      return {
        success: false,
        reason: `Low captcha trust score (${data.score})`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[Captcha] Verification request error:", error);
    if (isDev) return { success: true };
    return { success: false, reason: "Error connecting to CAPTCHA service." };
  }
}
