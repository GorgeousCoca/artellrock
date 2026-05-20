"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          // Сеть может быть недоступна; без перехвата — необработанный Promise у onClick.
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // См. выше: навигацию выполняем в любом случае.
        }
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Выйти
    </button>
  );
}
