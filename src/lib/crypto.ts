import { randomBytes, createHash, scrypt as scryptCallback, createCipheriv, createDecipheriv } from "crypto";
import { promisify } from "util";
import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";

const scrypt = promisify(scryptCallback);

// --- Tokens de uso único (ex.: redefinição de senha) ---
// Guardamos apenas o hash SHA-256 do token no banco; o token em texto puro
// só existe no link enviado ao usuário e nunca é persistido.
export function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

// --- Cofre / Secure Vault ---
// A senha mestra do usuário nunca é armazenada em texto puro. Guardamos um
// hash Argon2id (para verificação) e, separadamente, derivamos uma chave
// simétrica (via scrypt, com um salt próprio de 16 bytes por usuário) usada
// apenas em memória, durante a requisição, para cifrar/decifrar os itens do
// cofre com AES-256-GCM. A chave derivada nunca é persistida — apenas o
// hash de verificação e o salt de derivação ficam no banco.

export async function hashMasterPassword(masterPassword: string): Promise<string> {
  return argon2Hash(masterPassword, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyMasterPassword(masterPassword: string, hash: string): Promise<boolean> {
  try {
    return await argon2Verify(hash, masterPassword);
  } catch {
    return false;
  }
}

export function generateVaultSalt(): string {
  return randomBytes(16).toString("hex");
}

async function deriveVaultKey(masterPassword: string, saltHex: string): Promise<Buffer> {
  const salt = Buffer.from(saltHex, "hex");
  return (await scrypt(masterPassword, salt, 32)) as Buffer;
}

export async function encryptVaultSecret(
  plainText: string,
  masterPassword: string,
  saltHex: string,
): Promise<{ encryptedSecret: string; iv: string; authTag: string }> {
  const key = await deriveVaultKey(masterPassword, saltHex);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedSecret: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export async function decryptVaultSecret(
  encryptedSecret: string,
  iv: string,
  authTag: string,
  masterPassword: string,
  saltHex: string,
): Promise<string> {
  const key = await deriveVaultKey(masterPassword, saltHex);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedSecret, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
