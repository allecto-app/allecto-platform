import { Mail, Linkedin, Twitter, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-xl text-white">A</span>
              </div>
              <span className="text-xl text-white">Allecto App</span>
            </div>
            <p className="text-gray-400 max-w-md">
              Simplifique assembleias condominiais com votação digital segura, transparente e em conformidade com a legislação brasileira.
            </p>
            <div className="flex items-center gap-2 text-gray-400">
              <Mail className="w-4 h-4" />
              <a href="mailto:contato@allectoapp.com.br" className="hover:text-white transition-colors">
                contato@allectoapp.com.br
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white mb-4">Produto</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Demonstração</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Sobre nós</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2025 Allecto App. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
