import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "../config";

type GoogleContinueProps = {
  disabled?: boolean;
  onCredential: (idToken: string) => void;
  onError: (message: string) => void;
};

export function GoogleContinue({ disabled = false, onCredential, onError }: GoogleContinueProps) {
  const clientId = GOOGLE_CLIENT_ID.trim();
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const node = host.current;
    if (!node || !clientId) return;
    const measure = () => setWidth(Math.max(240, Math.floor(node.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [clientId]);

  if (!clientId) {
    return (
      <div>
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border border-linen bg-paper py-3 text-sm font-semibold text-outline"
        >
          <GoogleMark />
          Continue with Google
        </button>
        <p className="mt-2 text-center text-xs text-muted">Google sign-in needs VITE_GOOGLE_CLIENT_ID before it can be used.</p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div ref={host} className={`relative h-12 ${disabled ? "pointer-events-none opacity-60" : ""}`}>
        <div className="pointer-events-none flex h-12 items-center justify-center gap-2 rounded-full border border-forest bg-paper text-sm font-semibold text-forest">
          <GoogleMark />
          Continue with Google
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-full opacity-0">
          <GoogleLogin
            onSuccess={(response) => {
              if (!response.credential) {
                onError("Google did not return a sign-in credential.");
                return;
              }
              onCredential(response.credential);
            }}
            onError={() => onError("Google sign-in could not be completed.")}
            text="continue_with"
            shape="pill"
            size="large"
            width={String(width)}
          />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="#C85A32" d="M8 1.5a6.5 6.5 0 1 0 4.4 11.3l-1.8-1.4A4.2 4.2 0 1 1 8 3.8c1.1 0 2 .4 2.7 1.1L9.2 6.4H14.5V1.1L12.6 3A6.5 6.5 0 0 0 8 1.5Z" />
    </svg>
  );
}
