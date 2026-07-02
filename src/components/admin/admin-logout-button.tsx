"use client";

import { useRouter } from "next/navigation";

type AdminLogoutButtonProps = {
  onNavigate?: () => void;
};

export function AdminLogoutButton({ onNavigate }: AdminLogoutButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="admin-nav__logout"
      onClick={async () => {
        onNavigate?.();
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
