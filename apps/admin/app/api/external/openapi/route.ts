
import { NextResponse } from "next/server";

function buildOpenApiSpec() {
  const adminUrl = (process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.allecto.app").replace(/\/$/, "");

  return {
    openapi: "3.0.3",
    info: {
      title: "Allecto External API",
      version: "1.0.0",
      description:
        "API externa para condomínios no plano Pro.\n\nFluxo de autenticação:\n1) POST /api/external/token com apiKey + apiSecret.\n2) Use o accessToken retornado no header Authorization: Bearer <token> em todos os demais endpoints.",
    },
    servers: [{ url: adminUrl }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "AccessToken",
        },
      },
      schemas: {
        TokenRequest: {
          type: "object",
          required: ["apiKey", "apiSecret"],
          properties: {
            apiKey: { type: "string" },
            apiSecret: { type: "string" },
          },
        },
        UnitCreate: {
          type: "object",
          required: ["code"],
          properties: {
            code: { type: "string" },
            block: { type: "string" },
            floor: { type: "string" },
          },
        },
        ResidentCreate: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            role: { type: "string", enum: ["resident", "syndic", "manager", "council"] },
            unitId: { type: "string" },
            membershipRole: { type: "string", enum: ["owner", "tenant"] },
          },
        },
        MinuteCreate: {
          type: "object",
          required: ["title", "documentId", "closesAt"],
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            documentId: { type: "string" },
            closesAt: {
              type: "number",
              description: "Timestamp em milissegundos (futuro)",
            },
          },
        },
      },
    },
    paths: {
      "/api/external/token": {
        post: {
          tags: ["Auth"],
          summary: "Gerar bearer token",
          description: "Endpoint público para troca de apiKey/apiSecret por accessToken.",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TokenRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Token emitido",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean", example: true },
                      accessToken: { type: "string", example: "alt_xxxxxxxxxxxxx" },
                      tokenType: { type: "string", example: "Bearer" },
                      expiresAt: { type: "number", example: 1760000000000 },
                      expiresInSeconds: { type: "number", example: 900 },
                      condoId: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Credenciais inválidas" },
          },
        },
      },
      "/api/external/units": {
        get: {
          tags: ["Units"],
          summary: "Listar unidades",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "query", name: "limit", schema: { type: "integer" } }],
          responses: { "200": { description: "OK" } },
        },
        post: {
          tags: ["Units"],
          summary: "Criar unidade",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UnitCreate" } },
            },
          },
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/external/units/{unitId}": {
        get: {
          tags: ["Units"],
          summary: "Detalhe da unidade",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "unitId", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/external/residents": {
        get: {
          tags: ["Residents"],
          summary: "Listar moradores",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "query", name: "limit", schema: { type: "integer" } }],
          responses: { "200": { description: "OK" } },
        },
        post: {
          tags: ["Residents"],
          summary: "Criar morador",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ResidentCreate" } },
            },
          },
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/external/residents/{residentId}": {
        get: {
          tags: ["Residents"],
          summary: "Detalhe do morador",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "residentId", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/external/minutes": {
        get: {
          tags: ["Minutes"],
          summary: "Listar atas",
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "query", name: "limit", schema: { type: "integer" } },
            { in: "query", name: "status", schema: { type: "string", enum: ["open", "closed"] } },
          ],
          responses: { "200": { description: "OK" } },
        },
        post: {
          tags: ["Minutes"],
          summary: "Criar ata",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/MinuteCreate" } },
            },
          },
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/external/minutes/{minuteId}": {
        get: {
          tags: ["Minutes"],
          summary: "Detalhe da ata",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "minuteId", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/external/minutes/{minuteId}/close": {
        post: {
          tags: ["Minutes"],
          summary: "Encerrar ata",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "minuteId", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/external/minutes/{minuteId}/result": {
        get: {
          tags: ["Minutes"],
          summary: "Resultado da ata",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "minuteId", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
    },
  };
}

export async function GET(request: Request) {
  const spec = buildOpenApiSpec();
  const url = new URL(request.url);

  if (url.searchParams.get("ui") === "1") {
    const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Allecto External API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #fafafa; }
      #swagger-ui { max-width: 1200px; margin: 0 auto; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api/external/openapi',
        dom_id: '#swagger-ui',
        deepLinking: true,
      });
    </script>
  </body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json(spec);
}
