import "../src/styles/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GoogleTagManager } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "Allecto App",
  description:
    "Simplifique as assembleias do seu condomínio com convocações, votações e atas digitais.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <GoogleTagManager gtmId="GTM-PRXXLQHV" />
      <body>{children}</body>
    </html>
  );
}
