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

/** Reads a FormData into a plain object; repeated keys become arrays only for `arrayKeys`. */
export function formDataToObject(
  formData: FormData,
  arrayKeys: string[] = [],
): Record<string, FormDataEntryValue | FormDataEntryValue[]> {
  const out: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const key of new Set(formData.keys())) {
    out[key] = arrayKeys.includes(key) ? formData.getAll(key) : (formData.get(key) as FormDataEntryValue);
  }
  for (const key of arrayKeys) {
    if (!(key in out)) out[key] = [];
  }
  return out;
}
