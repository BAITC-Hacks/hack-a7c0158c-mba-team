"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type AuthMode = "login" | "register";
type AuthMethod = "email" | "phone";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const identifier = String(new FormData(event.currentTarget).get("identifier") ?? "").trim();
    const valid = method === "email"
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
      : /^\+?[0-9 ()-]{10,}$/.test(identifier);

    if (!valid) {
      setError(method === "email" ? "Введите корректный e-mail." : "Введите корректный номер телефона.");
      return;
    }

    window.localStorage.setItem("ai-sana:demo-user", JSON.stringify({ method, identifier }));
    setError("");
    setSubmitted(true);
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
          <p>{mode === "login" ? "Вы вошли в демо-режим." : "Аккаунт создан в демо-режиме."}</p>
          <Link className="text-link" href="/">Перейти на главную</Link>
        </div>
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
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button" type="submit">{action}</button>
          <p className="muted">Демо-режим: данные сохраняются только в этом браузере; код подтверждения не отправляется.</p>
        </form>
      )}
    </section>
  );
}
