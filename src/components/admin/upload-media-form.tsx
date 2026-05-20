"use client";

import { useState } from "react";

export function UploadMediaForm() {
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [status, setStatus] = useState("idle");

  return (
    <form
      className="card stack"
      action={async (formData) => {
        setStatus("uploading");
        try {
          // Загрузка файла и разбор JSON могут бросить; иначе в консоли «Unhandled rejection».
          const response = await fetch("/api/admin/upload", {
            method: "POST",
            body: formData
          });

          if (!response.ok) {
            setStatus("error");
            return;
          }

          const result = (await response.json()) as { url?: string };
          if (typeof result.url === "string" && result.url.length > 0) {
            setUploadedUrl(result.url);
            setStatus("done");
          } else {
            setStatus("error");
          }
        } catch {
          setStatus("error");
        }
      }}
    >
      <h1>Загрузка медиа</h1>
      <input className="field" name="file" type="file" required />
      <button className="button" type="submit">
        Загрузить
      </button>
      <span className="form-note">
        {status === "uploading"
          ? "Загрузка..."
          : status === "error"
            ? "Не удалось загрузить файл"
            : uploadedUrl
              ? `Файл доступен по адресу: ${uploadedUrl}`
              : "Файлы сохраняются в /public/uploads и могут использоваться в карточках каталога, портфолио и блоге."}
      </span>
    </form>
  );
}
