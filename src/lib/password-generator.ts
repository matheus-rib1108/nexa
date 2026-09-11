// Gerador de senhas 100% local: usa crypto.getRandomValues do navegador e
// nunca envia a senha gerada para o servidor.

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}?",
};

export function generatePassword(options: {
  length: number;
  lower: boolean;
  upper: boolean;
  numbers: boolean;
  symbols: boolean;
}): string {
  let charset = "";
  if (options.lower) charset += SETS.lower;
  if (options.upper) charset += SETS.upper;
  if (options.numbers) charset += SETS.numbers;
  if (options.symbols) charset += SETS.symbols;
  if (!charset) charset = SETS.lower + SETS.numbers;

  const randomValues = new Uint32Array(options.length);
  crypto.getRandomValues(randomValues);

  let result = "";
  for (let i = 0; i < options.length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}
