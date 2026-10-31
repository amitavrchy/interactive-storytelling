"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  CloudUpload,
  CloudDownload,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { api, apiConfigured, errorMessage } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { hydrate, progressSchema } from "@/features/story/storySlice";
import { chapters } from "@/lib/story-content";
import Dialog from "./dialog";
const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(72, "Use at most 72 characters."),
  name: z.string().optional(),
});
type Form = z.infer<typeof schema>;
export default function Account() {
  const {
    user,
    loading,
    accept,
    logout,
    sessionError,
    canReconnect,
    retrySession,
  } = useAuth();
  const story = useAppSelector((s) => s.story);
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [restore, setRestore] = useState(false);
  const {
    register,
    handleSubmit,
    setError: fieldError,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });
  async function submit(values: Form) {
    setError("");
    setMessage("");
    if (
      mode === "register" &&
      (!values.name || values.name.trim().length < 2)
    ) {
      fieldError("name", {
        message: "Enter a name of at least two characters.",
      });
      return;
    }
    if (mode === "register" && values.password.length < 10) {
      fieldError("password", { message: "Use at least 10 characters." });
      return;
    }
    try {
      const { data } = await api.post(
        `/auth/${mode}`,
        mode === "register"
          ? { ...values, name: values.name!.trim() }
          : { email: values.email, password: values.password },
      );
      accept(data);
      setMessage(
        "Welcome to the shore. You can save or restore your journey below.",
      );
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  async function sync(direction: "save" | "load") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (direction === "save") {
        const saved = progressSchema.parse(story);
        await api.put("/progress", saved);
        setMessage("Your journey is safely saved to your account.");
      } else {
        const { data } = await api.get("/progress");
        if (!data) {
          setMessage(
            "No cloud journey yet. Save this device's progress first.",
          );
          return;
        }
        const parsed = progressSchema.parse(data);
        dispatch(hydrate(parsed));
        setMessage("Your cloud journey is now on this device.");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      setRestore(false);
    }
  }
  return (
    <main id="main" className="account-page section-wrap">
      <div className="account-intro">
        <p className="eyebrow">A PLACE TO RETURN TO</p>
        <h1>
          Keep your
          <br />
          <em>place in the light.</em>
        </h1>
        <p className="muted">
          Your story already saves on this device. An optional account lets you
          carry it across the water.
        </p>
        <div className="account-progress">
          <p className="eyebrow">ON THIS DEVICE</p>
          <h3>
            {story.flags.length
              ? chapters[story.chapterIndex].label
              : "A story waiting to begin"}
          </h3>
          <p className="fineprint">
            {story.completed
              ? "Journey complete"
              : `${story.flags.length ? story.furthestChapter + 1 : 0} of 6 chapters discovered`}
          </p>
          <Link href="/story" className="text-link">
            Return to your story
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <section className="account-panel" aria-label="Your account">
        {sessionError && !loading && (
          <div className="notice" role="status">
            <p>{sessionError}</p>
            {canReconnect && (
              <button className="control-button" onClick={() => retrySession()}>
                Reconnect to your account
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
        {!apiConfigured ? (
          <>
            <p className="eyebrow">DEVICE EDITION</p>
            <h2>
              You&apos;re right
              <br />
              <em>where you belong.</em>
            </h2>
            <p className="muted">
              Accounts aren&apos;t connected in this edition. Your progress and
              preferences stay saved in this browser. All six chapters and both
              endings are yours to explore.
            </p>
            <Link className="button button-gold full-width" href="/story">
              Follow the light
              <ArrowRight size={17} />
            </Link>
          </>
        ) : loading ? (
          <p role="status">Finding your account…</p>
        ) : user ? (
          <>
            <p className="eyebrow">WELCOME BACK</p>
            <h2>
              {user.name}
              <span className="title-period">.</span>
            </h2>
            <p className="muted">{user.email}</p>
            <div className="cloud-actions">
              <button
                className="button button-gold"
                disabled={busy}
                onClick={() => sync("save")}
              >
                <CloudUpload size={17} />
                {busy ? "Connecting…" : "Save to cloud"}
              </button>
              <button
                className="button button-outline"
                disabled={busy}
                onClick={() => setRestore(true)}
              >
                <CloudDownload size={17} />
                Restore from cloud
              </button>
            </div>
            <p className="fineprint">
              Saving replaces the account&apos;s current journey. Restoring
              replaces the journey on this device. You choose when to sync.
            </p>
            {user.role === "ADMIN" && (
              <Link href="/admin" className="text-link studio-link">
                Open the studio
                <ArrowUpRight size={16} />
              </Link>
            )}
            <button
              className="control-button signout-button"
              onClick={() => {
                logout();
                setMessage("");
              }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </>
        ) : (
          <>
            <div className="filter-tabs account-tabs">
              <button
                aria-pressed={mode === "login"}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Sign in
              </button>
              <button
                aria-pressed={mode === "register"}
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Create account
              </button>
            </div>
            <h2>
              {mode === "login" ? "Welcome back." : "Make yourself at home."}
            </h2>
            <form onSubmit={handleSubmit(submit)} noValidate>
              {mode === "register" && (
                <label className="field-label">
                  Your name
                  <input
                    autoComplete="name"
                    {...register("name")}
                    aria-invalid={!!errors.name}
                  />
                  <span className="field-error">{errors.name?.message}</span>
                </label>
              )}
              <label className="field-label">
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                <span className="field-error">{errors.email?.message}</span>
              </label>
              <label className="field-label">
                Password
                <input
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  {...register("password")}
                  aria-invalid={!!errors.password}
                />
                <span className="field-error">{errors.password?.message}</span>
              </label>
              {mode === "register" && (
                <p className="fineprint">
                  At least 10 characters. No newsletters. Just your place in the
                  story.
                </p>
              )}
              <button
                type="submit"
                className="button button-gold full-width"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Finding the shore…"
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
                <ArrowRight size={17} />
              </button>
            </form>
          </>
        )}
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
      </section>
      <Dialog
        open={restore}
        onClose={() => setRestore(false)}
        title="Bring your journey home"
      >
        <h2>
          Restore your
          <br />
          <em>cloud journey?</em>
        </h2>
        <p className="muted">
          This replaces the progress, ending and preferences currently saved on
          this device.
        </p>
        <button
          className="button button-gold full-width"
          disabled={busy}
          onClick={() => sync("load")}
        >
          Restore from cloud
          <CloudDownload size={17} />
        </button>
        <button
          className="button button-quiet full-width"
          onClick={() => setRestore(false)}
        >
          Keep this device&apos;s journey
        </button>
      </Dialog>
    </main>
  );
}
