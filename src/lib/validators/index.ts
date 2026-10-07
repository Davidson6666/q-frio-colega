import { z } from "zod";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState = {
  ok: boolean;
  /** Form-level message (shown in an alert region). */
  error?: string;
  /** Per-field messages, keyed by input name. */
  fieldErrors?: FieldErrors;
  /** Non-error informational result, e.g. "check your inbox". */
  message?: string;
  /** Echo of non-sensitive values so the form can be repopulated after an error. */
  values?: Record<string, string | string[]>;
};

export const initialActionState: ActionState = { ok: false };

/** Converts a ZodError into the per-field shape used by ActionState. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}

/** Single string field from a FormData; missing or file entries become "". */
export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** All string values of a repeated field (e.g. checkboxes). */
export function formStrings(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((v): v is string => typeof v === "string");
}
