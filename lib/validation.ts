type TextResult<T extends string | null = string | null> =
  | { value: T }
  | { error: string };

export function readOptionalText(
  value: unknown,
  field: string,
  maxLength: number,
): TextResult {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: `${field} inválido.` };
  }

  const text = value.trim();

  if (text.length > maxLength) {
    return { error: `${field} deve ter no máximo ${maxLength} caracteres.` };
  }

  return { value: text || null };
}

export function readRequiredText(
  value: unknown,
  field: string,
  maxLength: number,
): TextResult<string> {
  const result = readOptionalText(value, field, maxLength);

  if ("error" in result) {
    return result;
  }

  if (!result.value) {
    return { error: `${field} é obrigatório.` };
  }

  return { value: result.value };
}

export function readOptionalUrl(
  value: unknown,
  field: string,
  maxLength = 500,
): TextResult {
  const result = readOptionalText(value, field, maxLength);

  if ("error" in result || result.value === null) {
    return result;
  }

  try {
    const url = new URL(result.value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { error: `${field} deve ser um link HTTP ou HTTPS.` };
    }
  } catch {
    return { error: `${field} inválido.` };
  }

  return result;
}