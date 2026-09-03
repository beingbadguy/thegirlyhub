"use client";

import { useAuthStore } from "@/store/store";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaApple, FaFacebookF } from "react-icons/fa";

declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
    AppleID?: any;
  }
}

function loadScript(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.id = id;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export default function SocialAuthButtons({
  redirectTo = "/",
}: {
  redirectTo?: string;
}) {
  const { setUser, syncCartAfterAuth } = useAuthStore();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

  const finishLogin = async (endpoint: string, payload: object) => {
    const response = await axios.post(endpoint, payload);
    setUser(response.data.data);
    await syncCartAfterAuth();
    router.push(redirectTo);
  };

  useEffect(() => {
    if (!googleClientId) return;
    loadScript("https://accounts.google.com/gsi/client", "google-gsi")
      .then(() => {
        if (!window.google || !googleBtnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential: string }) => {
            setLoading("google");
            setError("");
            try {
              await finishLogin("/api/auth/google", {
                idToken: response.credential,
              });
            } catch (err) {
              if (err instanceof AxiosError) {
                setError(err.response?.data?.message || "Google login failed.");
              } else {
                setError("Google login failed.");
              }
            } finally {
              setLoading(null);
            }
          },
        });
        googleBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 360,
          text: "continue_with",
        });
      })
      .catch(() => setError("Could not load Google login."));
  }, [googleClientId]);

  const facebookLogin = async () => {
    if (!facebookAppId) return;
    setLoading("facebook");
    setError("");
    try {
      await loadScript("https://connect.facebook.net/en_US/sdk.js", "facebook-jssdk");
      await new Promise<void>((resolve) => {
        if (window.FB) {
          resolve();
          return;
        }
        window.fbAsyncInit = () => {
          window.FB.init({
            appId: facebookAppId,
            cookie: true,
            xfbml: false,
            version: "v21.0",
          });
          resolve();
        };
      });
      if (window.FB && !window.FB.getAuthResponse) {
        window.FB.init({
          appId: facebookAppId,
          cookie: true,
          xfbml: false,
          version: "v21.0",
        });
      }

      window.FB.login(
        async (response: { authResponse?: { accessToken: string } }) => {
          try {
            if (!response.authResponse?.accessToken) {
              setError("Facebook login was cancelled.");
              return;
            }
            await finishLogin("/api/auth/facebook", {
              accessToken: response.authResponse.accessToken,
            });
          } catch (err) {
            if (err instanceof AxiosError) {
              setError(err.response?.data?.message || "Facebook login failed.");
            } else {
              setError("Facebook login failed.");
            }
          } finally {
            setLoading(null);
          }
        },
        { scope: "email,public_profile" },
      );
    } catch {
      setError("Could not load Facebook login.");
      setLoading(null);
    }
  };

  const appleLogin = async () => {
    if (!appleClientId || !appleRedirectUri) return;
    setLoading("apple");
    setError("");
    try {
      await loadScript(
        "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js",
        "apple-auth",
      );
      window.AppleID.auth.init({
        clientId: appleClientId,
        scope: "name email",
        redirectURI: appleRedirectUri,
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      const idToken = response?.authorization?.id_token;
      const fullName = response?.user?.name;
      const name = fullName
        ? `${fullName.firstName || ""} ${fullName.lastName || ""}`.trim()
        : undefined;
      await finishLogin("/api/auth/apple", { idToken, name });
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Apple login failed.");
      } else {
        setError("Apple login failed or was cancelled.");
      }
    } finally {
      setLoading(null);
    }
  };

  if (!googleClientId && !facebookAppId && !appleClientId) {
    return (
      <div className="mt-4 w-full max-w-md space-y-2">
        <p className="text-center text-xs text-yellow-600 bg-yellow-50 rounded p-2">
          ⚠️ Social login not configured. Add OAuth credentials to .env file.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 w-full max-w-md space-y-3">
      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        Continue with
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      {googleClientId && (
        <div className="flex justify-center">
          <div ref={googleBtnRef} className="min-h-[40px] w-full max-w-[360px]" />
        </div>
      )}

      {facebookAppId && (
        <button
          type="button"
          disabled={!!loading}
          onClick={facebookLogin}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
        >
          <FaFacebookF className="text-[#1877F2]" />
          {loading === "facebook" ? "Connecting..." : "Continue with Facebook"}
        </button>
      )}

      {appleClientId && appleRedirectUri && (
        <button
          type="button"
          disabled={!!loading}
          onClick={appleLogin}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-900 bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          <FaApple />
          {loading === "apple" ? "Connecting..." : "Continue with Apple"}
        </button>
      )}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}
    </div>
  );
}
