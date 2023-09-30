"use client";

import { useCallback, useTransition } from "react";

export type Result<T> =
  | { success: true; data?: T }
  | { success: false; error: string };

type Action<A, T> = (data: A) => Promise<Result<T>>;

export function useServerAction<A, T>(action: Action<A, T>) {
  const [pending, startTransition] = useTransition();

  const mutate = useCallback(
    (
      data: A,
      callback?: {
        onSuccess?: (data?: T) => void;
        onError?: (error: string) => void;
      },
    ) => {
      startTransition(async () => {
        const result = await action(data);

        if (result.success && callback?.onSuccess) {
          callback?.onSuccess(result.data);
        }

        if (!result.success && callback?.onError) {
          callback.onError(result.error);
        }
      });
    },
    [action],
  );

  return {
    mutate,
    status: pending ? "loading" : "idle",
    isLoading: pending,
  };
}
