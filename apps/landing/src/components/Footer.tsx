import { Mail, Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Image
                  src="/images/logo-allecto-white.png"
                  alt="Allecto App"
                  width={130}
                  height={46}
                />
              </Link>
            </div>
            <p className="text-gray-400 max-w-md">
              Simplifique assembleias condominiais com votação digital segura,
              transparente e em conformidade com a legislação brasileira.
            </p>
            <div className="flex items-center gap-2 text-gray-400">
              <Mail className="w-4 h-4" />
              <a
                href="mailto:suporte@allecto.app"
                className="hover:text-white transition-colors"
              >
                suporte@allecto.app
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white mb-4">Produto</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#recursos"
                  className="hover:text-white transition-colors"
                >
                  Recursos
                </a>
              </li>
              <li>
                <a
                  href="#precos"
                  className="hover:text-white transition-colors"
                >
                  Preços
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Segurança
                </a>
              </li>
              <li>
                <a
                  href="#contato"
                  className="hover:text-white transition-colors"
                >
                  Demonstração
                </a>
              </li>
              <li>
                <a
                  href="https://blog.allecto.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="/politica-de-privacidade"
                  className="hover:text-white transition-colors"
                >
                  Política de Privacidade
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 Allecto App. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/allecto.app/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
