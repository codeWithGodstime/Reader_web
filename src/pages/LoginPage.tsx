import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { GoogleContinue } from "../components/GoogleContinue";
import { useShop } from "../context/ShopContext";

export function LoginPage() {
  const { login, loginWithGoogle, register, user } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeFromUrl = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(modeFromUrl);

  useEffect(() => {
    setMode(modeFromUrl);
  }, [modeFromUrl]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <p className="font-display text-3xl text-forest">You are signed in as {user.name}.</p>
        <Link to="/" className="mt-4 inline-flex rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white">Continue browsing</Link>
      </div>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      navigate("/");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Sign-in could not be completed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <p className="text-[11px] font-bold tracking-[0.16em] text-terracotta uppercase">Reader Guild</p>
      <h1 className="font-display text-4xl text-forest">{mode === "login" ? "Sign in" : "Create your shelf"}</h1>
      <p className="mt-2 text-sm text-muted">Catalog browsing is open. A bag, checkout, and orders use your account.</p>
      <div className="mt-6 space-y-4 rounded-2xl bg-card p-6 shadow-sm">
        <GoogleContinue
          disabled={pending}
          onCredential={(idToken) => {
            setPending(true);
            setError("");
            loginWithGoogle(idToken)
              .then(() => navigate("/"))
              .catch((caught: unknown) => {
                setError(caught instanceof ApiError ? caught.message : "Google sign-in could not be completed.");
              })
              .finally(() => setPending(false));
          }}
          onError={setError}
        />
        <p className="text-center text-xs tracking-wide text-muted uppercase">or continue with email</p>
      <form onSubmit={(event) => void submit(event)} className="space-y-3">
        {mode === "register" && (
          <label className="block text-sm font-semibold">
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required className="mt-1 w-full rounded-xl border border-linen px-3 py-3 font-normal outline-none focus:border-forest" />
          </label>
        )}
        <label className="block text-sm font-semibold">
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1 w-full rounded-xl border border-linen px-3 py-3 font-normal outline-none focus:border-forest" />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} className="mt-1 w-full rounded-xl border border-linen px-3 py-3 font-normal outline-none focus:border-forest" />
        </label>
        {error && <p className="text-sm text-terracotta">{error}</p>}
        <button type="submit" disabled={pending} className="w-full rounded-full bg-forest py-3 text-sm font-semibold text-white disabled:bg-outline">
          {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <button type="button" className="w-full text-sm text-muted hover:text-forest" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Need an account? Register" : "Already reading with us? Sign in"}
        </button>
      </form>
      </div>
    </div>
  );
}
