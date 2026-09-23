"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type AuthMode = "login" | "register";
type AuthMethod = "email" | "phone";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [error, setError] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, method, identifier: data.get("identifier"), password: data.get("password") }),
      });
      const result = await response.json() as { error?: string; authenticated?: boolean; verificationToken?: string; devCode?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось продолжить.");
      if (result.authenticated) { setSubmitted(true); return; }
      setVerificationToken(result.verificationToken || "");
      setDevCode(result.devCode || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось связаться с сервером.");
    } finally { setBusy(false); }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken, code }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось подтвердить код.");
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось связаться с сервером.");
    } finally { setBusy(false); }
  }

  const title = mode === "login" ? "Войти в AI Sana" : "Создать аккаунт";
  const action = mode === "login" ? "Войти" : "Зарегистрироваться";

  return (
    <section className="auth-page">
      <p className="eyebrow">AI Sana · Аккаунт</p>
      <h1>{title}</h1>
      <p className="auth-intro">Выберите удобный способ: e-mail или номер телефона.</p>

      {submitted ? (
        <div className="success-message" role="status">
          <p>{mode === "login" ? "Вы вошли в аккаунт." : "Аккаунт создан."}</p>
          <Link className="text-link" href="/">Перейти на главную</Link>
        </div>
      ) : verificationToken ? (
        <form className="auth-card" onSubmit={verify}>
          <h2>Подтвердите {method === "email" ? "e-mail" : "номер телефона"}</h2>
          <p className="muted">{devCode ? "В локальном режиме код показан ниже; сообщение не отправляется." : "Мы отправили шестизначный код на указанный контакт."}</p>
          {devCode && <p className="task-notice"><strong>Код для локального демо:</strong> {devCode}</p>}
          <label className="auth-field"><span>Код подтверждения</span><input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoFocus /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button" type="submit" disabled={busy}>Подтвердить</button>
        </form>
      ) : (
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-tabs" aria-label="Действие с аккаунтом">
            <button className={mode === "login" ? "is-active" : ""} type="button" onClick={() => setMode("login")}>Вход</button>
            <button className={mode === "register" ? "is-active" : ""} type="button" onClick={() => setMode("register")}>Регистрация</button>
          </div>
          <div className="auth-tabs" aria-label="Способ входа">
            <button className={method === "email" ? "is-active" : ""} type="button" onClick={() => setMethod("email")}>По e-mail</button>
            <button className={method === "phone" ? "is-active" : ""} type="button" onClick={() => setMethod("phone")}>По телефону</button>
          </div>
          <label className="auth-field">
            <span>{method === "email" ? "E-mail" : "Номер телефона"}</span>
            <input
              key={method}
              name="identifier"
              type={method === "email" ? "email" : "tel"}
              autoComplete={method === "email" ? "email" : "tel"}
              placeholder={method === "email" ? "name@example.com" : "+7 700 000 00 00"}
              required
            />
          </label>
          <label className="auth-field"><span>Пароль</span><input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} placeholder="Минимум 8 символов" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button" type="submit" disabled={busy}>{action}</button>
          <p className="muted">Пароль хранится в базе только в виде криптографического хеша.</p>
        </form>
      )}
    </section>
  );
}
