import { describe, expect, it } from "vitest";
import { parseBulkCsv } from "./bulkUpload";

const buildBlob = (content: string) => new Blob([content], { type: "text/csv" });

describe("parseBulkCsv", () => {
  it("parses units and residents when values are provided", async () => {
    const csv = `unit_code,unit_block,unit_floor,resident_name,resident_email,resident_role
A-12,A,1,João,joao@example.com,syndic`; // newline
    const { rows, errors } = await parseBulkCsv(buildBlob(csv));
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      unit: { code: "A-12", block: "A", floor: "1" },
      resident: { name: "João", email: "joao@example.com", role: "syndic" },
    });
  });

  it("collects errors when row misses required unit code", async () => {
    const csv = `unit_code,unit_block,unit_floor,resident_name
,Bloco B,4,`
      + "\n";
    const { errors } = await parseBulkCsv(buildBlob(csv));
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Informe o código da unidade");
  });

  it("flags empty rows to guide the operator", async () => {
    const csv = `unit_code,unit_block,unit_floor,resident_name,note\n,,,,unused`;
    const { errors } = await parseBulkCsv(buildBlob(csv));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.message).toContain("Linha vazia");
  });
});
