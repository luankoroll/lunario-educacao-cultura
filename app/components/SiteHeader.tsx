"use client";

import { useEffect, useState } from "react";
import { Brand } from "./Brand";
import { navItems } from "../lib/content";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="site-header">
      <div className="site-header__inner page-shell">
        <Brand />

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="primary-navigation"
          aria-label={open ? "Fechar menu principal" : "Abrir menu principal"}
          onClick={() => setOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          className={`primary-nav ${open ? "primary-nav--open" : ""}`}
          id="primary-navigation"
          aria-label="Navegação principal"
        >
          {navItems.map((item) => (
            <a
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
