export default function ExternalApiDocsPage() {
  return (
    <main style={{ width: "100%", minHeight: "100vh", margin: 0, background: "#fafafa" }}>
      <iframe
        title="Allecto External API Docs"
        src="/api/external/openapi?ui=1"
        style={{ width: "100%", minHeight: "100vh", border: "none" }}
      />
    </main>
  );
}
