"use client";

import * as React from "react";

export type ActionStatus = "idle" | "loading" | "success" | "error";

export type ActionError = string | string[] | null;

export type ActionFunction<A, T> = (args: A) => Promise<{
  status: ActionStatus;
  error?: ActionError;
  data?: T | null;
}>;

export type ActionReturn = {
  status: "idle" | "loading";
};

export type ActionReturnError = {
  status: "error";
  error: string;
};

export type ActionReturnSuccess<T> = {
  status: "success";
  data?: T;
};

export type ActionReturnType<T> = Promise<
  ActionReturn | ActionReturnError | ActionReturnSuccess<T>
>;

export function useAction<A, T>(action: ActionFunction<A, T>) {
  const [pending, startTransition] = React.useTransition();
  const [status, setStatus] = React.useState<ActionStatus>("idle");
  const [error, setError] = React.useState<ActionError>(null);
  const [data, setData] = React.useState<T | null | undefined>();
  const actionRef = React.useRef(action);

  const mutate = React.useMemo(
    () =>
      (
        input: A,
        {
          onSuccess,
          onError,
        }: {
          onSuccess?: (data?: T | null) => void | Promise<void>;
          onError?: (
            error?: ActionError,
            data?: T | null,
          ) => void | Promise<void>;
        } = {},
      ) => {
        setError(null);
        setStatus("loading");

        startTransition(async () => {
          const { status, error, data } = await actionRef.current(input);

          if (error) {
            setError(error);
          }

          setStatus(status);

          if (status === "success" && data) {
            setData(data);
          }

          if (onSuccess && status === "success") {
            await onSuccess(data);
          }

          if (onError && status === "error") {
            await onError(error, data);
          }
        });
      },
    [],
  );

  return {
    mutate,
    status,
    error,
    data,
    isLoading: pending,
    isError: status === "error",
    isSuccess: status === "success",
  };
}
