"use client";

import { useEffect, useRef } from "react";
import type { ActionState } from "@/lib/form";

/**
 * After a failed submit, moves focus to the first invalid field so keyboard and
 * screen-reader users land on the problem. Attach the returned ref to the <form>.
 */
export function useFocusFirstError(state: ActionState) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  return formRef;
}
