import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  const { notice, clearNotice } = useShop();

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(clearNotice, 2400);
    return () => window.clearTimeout(timer);
  }, [notice, clearNotice]);

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="min-h-[calc(100vh-80px)] bg-surface pt-[7.25rem]">
        <Outlet />
      </main>
      <Footer />
      {notice && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm text-white shadow-paper">
          <span className="material-symbols-outlined icon-fill text-base">check_circle</span>
          {notice}
        </div>
      )}
    </div>
  );
}
