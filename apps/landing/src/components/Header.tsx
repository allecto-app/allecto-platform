"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export function Header() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleMenu = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const handleNavigate = () => {
    setIsMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image
                src="/images/logo-allecto.png"
                alt="Allecto App"
                width={130}
                height={46}
              />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/#recursos"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Recursos
            </Link>
            <Link
              href="/#precos"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Preços
            </Link>
            <Link
              href="/#faq"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/#contato"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Contato
            </Link>
            <Link
              href="https://blog.allecto.app/"
              target="_blank"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <a
              className="hidden md:inline-flex text-primary"
              href="https://portal.allecto.app"
              target="_blank"
              rel="noreferrer"
            >
              Login
            </a>
            <Button className="bg-primary hover:bg-accent text-primary-foreground">
              <a href="#precos">Começar agora</a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-primary"
              onClick={handleToggleMenu}
              aria-expanded={isMobileOpen}
              aria-label="Alternar menu"
            >
              {isMobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
      {isMobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="flex flex-col gap-4 px-4 py-6 text-gray-600">
            <a
              href="#recursos"
              onClick={handleNavigate}
              className="hover:text-gray-900 transition-colors"
            >
              Recursos
            </a>
            <a
              href="#precos"
              onClick={handleNavigate}
              className="hover:text-gray-900 transition-colors"
            >
              Preços
            </a>
            <a
              href="#faq"
              onClick={handleNavigate}
              className="hover:text-gray-900 transition-colors"
            >
              FAQ
            </a>
            <a
              href="#contato"
              onClick={handleNavigate}
              className="hover:text-gray-900 transition-colors"
            >
              Contato
            </a>
            <a
              href="https://portal.allecto.app"
              target="_blank"
              rel="noreferrer"
              onClick={handleNavigate}
              className="text-primary hover:text-accent transition-colors"
            >
              Login
            </a>
            <Button
              className="bg-primary hover:bg-accent text-primary-foreground"
              onClick={handleNavigate}
              asChild
            >
              <a href="#precos">Começar agora</a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
