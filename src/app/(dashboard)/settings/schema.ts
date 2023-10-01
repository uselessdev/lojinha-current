import { z } from "zod";
import * as CNPJ from "@fnando/cnpj";

export const storeSchema = z.object({
  id: z.string().optional(),
  store: z.string().min(1, "ID da loja é inválido"),
  name: z.string().min(1, "Sua loja precisa de um nome válido"),
  url: z.string().min(1, "URL da loja é inválido"),
  emails: z.array(z.string().email("Informe apenas e-mails válidos")),
  cnpj: z
    .string()
    .refine((value: string) => CNPJ.isValid(value), "Informe um CNPJ válido."),
});

export type StoreSchema = z.infer<typeof storeSchema>;
