declare module "bcryptjs" {
  export function genSaltSync(rounds?: number, seed_length?: number): string;
  export function genSalt(rounds?: number, seed_length?: number): Promise<string>;
  export function hashSync(data: string, salt: string | number): string;
  export function hash(data: string, salt: string | number): Promise<string>;
  export function compareSync(data: string, encrypted: string): boolean;
  export function compare(data: string, encrypted: string): Promise<boolean>;
  export function getRounds(encrypted: string): number;
  export const version: string;
  const bcrypt: {
    genSaltSync: typeof genSaltSync;
    genSalt: typeof genSalt;
    hashSync: typeof hashSync;
    hash: typeof hash;
    compareSync: typeof compareSync;
    compare: typeof compare;
    getRounds: typeof getRounds;
    version: typeof version;
  };
  export default bcrypt;
}
