"use client";

import { Menu } from "lucide-react";

export function AdminMobileToggle() {
  function toggleSidebar() {
    const sidebar = document.getElementById("admin-sidebar");
    const overlay = document.getElementById("admin-overlay");
    sidebar?.classList.toggle("open");
    overlay?.classList.toggle("open");

    // Close on overlay click
    overlay?.addEventListener("click", () => {
      sidebar?.classList.remove("open");
      overlay?.classList.remove("open");
    }, { once: true });
  }

  return (
    <button className="admin-hamburger" onClick={toggleSidebar} aria-label="Menu">
      <Menu />
    </button>
  );
}
