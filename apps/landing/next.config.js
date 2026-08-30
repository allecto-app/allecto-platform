/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    return [
      {
        source: "/pt/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance",
        destination: "/pt/gestao-de-documentos/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance",
        permanent: true,
      },
    ];
  },
};
module.exports = nextConfig;
