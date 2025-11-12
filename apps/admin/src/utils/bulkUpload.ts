import Papa from "papaparse";

export const BULK_TEMPLATE_PATH = "/templates/bulk-upload.csv";

const RESIDENT_ROLES = ["resident", "syndic", "manager", "council"] as const;
const MEMBERSHIP_ROLES = ["owner", "tenant"] as const;

export type ResidentRole = (typeof RESIDENT_ROLES)[number];
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export interface BulkCsvUnit {
  code: string;
  block?: string;
  floor?: string;
}

export interface BulkCsvResident {
  name: string;
  email?: string;
  phone?: string;
  role?: ResidentRole;
  membershipRole?: MembershipRole;
}

export interface BulkCsvRow {
  rowNumber: number;
  unit: BulkCsvUnit | null;
  resident: BulkCsvResident | null;
}

export interface BulkCsvError {
  rowNumber: number;
  message: string;
}

export interface ParsedBulkCsv {
  rows: BulkCsvRow[];
  errors: BulkCsvError[];
}

type RawCsvRow = Record<string, string | undefined>;

const HEADER_MAP = {
  unitCode: "unit_code",
  unitBlock: "unit_block",
  unitFloor: "unit_floor",
  residentName: "resident_name",
  residentEmail: "resident_email",
  residentPhone: "resident_phone",
  residentRole: "resident_role",
  membershipRole: "membership_role",
} as const;

const normalizeString = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const normalizeRole = (value?: string | null): ResidentRole | undefined => {
  const normalized = normalizeString(value)?.toLowerCase();
  if (!normalized) return undefined;
  return RESIDENT_ROLES.find((role) => role === normalized) as ResidentRole | undefined;
};

const normalizeMembership = (value?: string | null): MembershipRole | undefined => {
  const normalized = normalizeString(value)?.toLowerCase();
  if (!normalized) return undefined;
  return MEMBERSHIP_ROLES.find((role) => role === normalized) as MembershipRole | undefined;
};

const extractUnit = (row: RawCsvRow): BulkCsvUnit | null => {
  const code = normalizeString(row[HEADER_MAP.unitCode]);
  const block = normalizeString(row[HEADER_MAP.unitBlock]);
  const floor = normalizeString(row[HEADER_MAP.unitFloor]);

  if (!code && !block && !floor) {
    return null;
  }

  if (!code) {
    throw new Error("Informe o código da unidade (unit_code).");
  }

  return { code, block, floor };
};

const extractResident = (row: RawCsvRow): BulkCsvResident | null => {
  const name = normalizeString(row[HEADER_MAP.residentName]);
  const email = normalizeString(row[HEADER_MAP.residentEmail]);
  const phone = normalizeString(row[HEADER_MAP.residentPhone]);
  const role = normalizeRole(row[HEADER_MAP.residentRole]);
  const membershipRole = normalizeMembership(row[HEADER_MAP.membershipRole]);

  if (!name && !email && !phone && !role && !membershipRole) {
    return null;
  }

  if (!name) {
    throw new Error("Informe o nome do morador (resident_name).");
  }

  if (membershipRole && !role) {
    // Keep membership role even when role is missing, to allow defaults on the backend.
  }

  return { name, email, phone, role, membershipRole };
};

export async function parseBulkCsv(file: File | Blob): Promise<ParsedBulkCsv> {
  const csvFile = file instanceof File ? file : new File([file], "bulk-upload.csv", { type: file.type || "text/csv" });

  const { data, errors: parseErrors } = await new Promise<{
    data: RawCsvRow[];
    errors: Papa.ParseError[];
  }>((resolve, reject) => {
    Papa.parse<RawCsvRow>(csvFile, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (result) => resolve({ data: result.data, errors: result.errors }),
      error: (error) => reject(error),
      transformHeader: (header) => header.trim(),
    });
  });

  const rows: BulkCsvRow[] = [];
  const errors: BulkCsvError[] = [];

  if (parseErrors.length > 0) {
    errors.push(
      ...parseErrors.map((error) => ({
        rowNumber: Number(error.row ?? 0) + 1,
        message: error.message,
      })),
    );
    return { rows, errors };
  }

  data.forEach((rawRow, index) => {
    const rowNumber = index + 2; // account for header row
    try {
      const unit = extractUnit(rawRow);
      const resident = extractResident(rawRow);

      if (!unit && !resident) {
        errors.push({
          rowNumber,
          message: "Linha vazia. Preencha dados de unidade, morador ou ambos.",
        });
        return;
      }

      rows.push({ rowNumber, unit, resident });
    } catch (error) {
      errors.push({
        rowNumber,
        message: error instanceof Error ? error.message : "Erro ao processar a linha.",
      });
    }
  });

  return { rows, errors };
}
