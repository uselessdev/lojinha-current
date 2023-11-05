import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const intl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatter = {
  number: (value: string) => {
    return Number(value.replace(/\D+/g, ""));
  },

  currency: (value: number) => {
    return intl.format(value / 100);
  },

  date: (
    date?: number | Date,
    style: "full" | "long" | "medium" | "short" | undefined = "medium",
  ) => {
    const intl = new Intl.DateTimeFormat("pt-br", {
      dateStyle: style,
    });

    return intl.format(date);
  },

  priceToNumberOrUndefined: (price?: string) => {
    if (!price) {
      return undefined;
    }

    return formatter.number(price);
  },
};
