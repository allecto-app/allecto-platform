import { Button } from "./ui/button";
import { Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-xl text-white">A</span>
            </div>
            <span className="text-xl text-primary">Allecto App</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-gray-600 hover:text-gray-900 transition-colors">
              Recursos
            </a>
            <a href="#precos" className="text-gray-600 hover:text-gray-900 transition-colors">
              Preços
            </a>
            <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">
              FAQ
            </a>
            <a href="#contato" className="text-gray-600 hover:text-gray-900 transition-colors">
              Contato
            </a>
          </nav>
          
          <div className="flex items-center gap-4">
            <a className="hidden md:inline-flex text-primary" href="https://portal.allecto.app" target="_blank" rel="noreferrer">
              Login
            </a>
            <Button className="bg-primary hover:bg-accent text-primary-foreground">
              <a href="#precos">
                Começar agora
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden text-primary">
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
