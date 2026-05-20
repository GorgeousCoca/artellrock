"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  return (
    <form
      className="card stack"
      action={async (formData) => {
        try {
          // Любая сетевая ошибка у fetch — отклонённый Promise; перехватываем, чтобы не засорять консоль и показать сообщение.
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: String(formData.get("email") ?? ""),
              password: String(formData.get("password") ?? "")
            })
          });

          if (!response.ok) {
            setError("Неверный email или пароль");
            return;
          }

          router.push("/admin");
          router.refresh();
        } catch {
          setError("Не удалось связаться с сервером. Проверьте сеть и попробуйте снова.");
        }
      }}
    >
      <h1>Вход в админку</h1>
      <input className="field" name="email" placeholder="Email" type="email" required />
      <input className="field" name="password" placeholder="Пароль" type="password" required />
      <button className="button" type="submit">
        Войти
      </button>
      {error ? <p>{error}</p> : null}
    </form>
  );
}
