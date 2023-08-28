"use client";

import { type Collection } from "@prisma/client";
import { type SubmitHandler, useForm } from "react-hook-form";
import slugify from "slugify";
import { type ProductSchema, productSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Autocomplete } from "~/components/autocomplete";
import { Editor } from "~/components/editor";
import { formatter } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { InputUpload } from "~/components/input-upload";
import { useState } from "react";
import { useUploadThing } from "~/lib/uploadthing";
import { useAction } from "~/lib/use-action";
import { createProductAction } from "../actions/create-product-action";
import { toast } from "~/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type Props = {
  collections: Collection[];
};

export function CreateProductForm({ collections }: Props) {
  const { organization } = useOrganization();
  const { user } = useUser();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const router = useRouter();

  const form = useForm<ProductSchema>({
    mode: "onBlur",
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: "DRAFT",
      store: String(organization?.id),
      user: String(user?.id),
    },
  });

  const options = collections.map((collection) => ({
    label: collection.name,
    value: collection.id,
  }));

  const { startUpload, isUploading } = useUploadThing("products");

  const { mutate, isLoading } = useAction(createProductAction);

  const onSubmit: SubmitHandler<ProductSchema> = (data) => {
    mutate(data, {
      onSuccess: async (data) => {
        await startUpload(selectedFiles, { product: String(data?.id) });

        toast({
          title: "Novo Produto.",
          description: "Seu produto foi adicionado.",
          className: "shadow-none p-3",
        });

        router.refresh();
        router.push(`/products`);
      },
      onError: () => {
        toast({
          title: "Ops, alguma coisa deu errado",
          description: "Não conseguimos criar seu produto no momento.",
          className: "shadow-none p-3",
        });
      },
    });
  };

  return (
    <Form {...form}>
      {/* eslint-disable-next-line */}
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={({ target }) => {
                    form.setValue("name", target.value);
                    form.setValue(
                      "slug",
                      slugify(target.value, { lower: true, trim: true }),
                    );
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status para este produto" />
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="DRAFT">Rascunho</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input {...field} readOnly />
              </FormControl>
              <FormMessage />
              <FormDescription>
                Este campo é preenchido de forma automatica.
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="collections"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Coleções</FormLabel>
                <FormControl>
                  <Autocomplete
                    options={options}
                    {...field}
                    onChange={({ target }) => {
                      form.setValue(
                        "collections",
                        target.value.map(({ value }) => value),
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          // @ts-expect-error name is not from schema
          name="cover"
          render={() => (
            <FormItem>
              <FormLabel>Imagem</FormLabel>
              <FormControl>
                <InputUpload
                  multiple
                  files={selectedFiles}
                  onRemoveFile={(file) => {
                    const isString = typeof file === "string";

                    if (!isString) {
                      setSelectedFiles((files) =>
                        files.filter((f) => f.name !== file.name),
                      );
                    }
                  }}
                  onChange={(event) =>
                    setSelectedFiles((selected) => [
                      ...selected,
                      ...event.target.files,
                    ])
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <Editor
              label="Descrição"
              {...field}
              /** @todo we should allow save raw text instead only html */
              onChange={({ html }) => form.setValue("description", html)}
            />
          )}
        />

        <div className="flex w-full gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Preço</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={({ target }) => {
                      form.setValue(
                        "price",
                        formatter.currency(formatter.number(target.value)),
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="originalPrice"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Preço Original</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={({ target }) => {
                      form.setValue(
                        "originalPrice",
                        formatter.currency(formatter.number(target.value)),
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={({ target }) =>
                      form.setValue("quantity", formatter.number(target.value))
                    }
                    type="number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="mt-6"
          size="sm"
          disabled={isLoading || isUploading}
        >
          {isLoading || isUploading ? "Criando..." : "Criar Produto"}
        </Button>
      </form>
    </Form>
  );
}
