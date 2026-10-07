/** Result of a Server Action used with useActionState. */
export type ActionState = {
  error?: string;
};

export const initialActionState: ActionState = {};

/** Single string field from a FormData; missing or file entries become "". */
export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
