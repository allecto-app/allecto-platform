import React from "react";
import type { Minute } from "@allecto/contracts/minutes";

export default function Admin() {
  const example: Minute = {
    id: "stub",
    condominiumId: "condo1",
    title: "Assembleia Ordinária",
    pdfUrl: "https://example.com/ata.pdf",
    publishedAt: Date.now(),
    closesAt: Date.now() + 5*24*3600*1000,
    status: "open"
  };
  return (
    <main style={{padding: 24, fontFamily: "system-ui"}}>
      <h1>Admin Allecto</h1>
      <pre>{JSON.stringify(example, null, 2)}</pre>
    </main>
  );
}
