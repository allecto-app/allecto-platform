import "../src/styles/globals.css";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { Providers } from "./providers";
import { parseHostFromHeader } from "../src/lib/host";

export const metadata = {
  title: "Allecto Admin",
  description: "Portal administrativo Allecto",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const headerList = headers();
  const hostHeader = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const hostInfo = parseHostFromHeader(hostHeader);

  return (
    <html lang="pt-BR">
      <body
        data-hostname={hostInfo.hostname}
        data-condo-subdomain={hostInfo.subdomain ?? ""}
        data-portal-domain={hostInfo.isPortal ? "true" : "false"}
      >
        <Providers host={hostInfo}>{children}</Providers>
      </body>
    </html>
  );
}
