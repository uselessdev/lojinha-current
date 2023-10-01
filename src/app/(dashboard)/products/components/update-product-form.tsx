"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type ProductSchema, productSchema } from "../schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Product, type Collection, type Image } from "@prisma/client";
import { useUploadThing } from "~/lib/uploadthing";
import { updateProductAction } from "../actions/update-product-action";
import { toast } from "~/components/ui/use-toast";
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
import slugify from "slugify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Autocomplete } from "~/components/autocomplete";
import { InputUpload } from "~/components/input-upload";
import { Editor } from "~/components/editor";
import { formatter } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { deleteImagesAction } from "../../collections/actions/delete-images-action";
import { useServerAction } from "~/lib/actions/use-action";

type Props = {
  collections: Collection[];
  product: Product & { collections: Collection[]; images: Image[] };
};

export function UpdateProductForm({ collections, product }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const images = useServerAction(deleteImagesAction);
  const router = useRouter();

  const form = useForm<ProductSchema>({
    mode: "onBlur",
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: product.id,
      status: product.status ?? "DRAFT",
      name: product.name,
      slug: product.slug,
      price: product.price ? formatter.currency(product.price) : "",
      originalPrice: product.originalPrice
        ? formatter.currency(product.originalPrice)
        : "",
      sku: product.sku ?? "",
      quantity: product.quantity ?? 1,
    },
  });

  const selectedCollections = product.collections.map((collection) => ({
    label: collection.name,
    value: collection.id,
  }));

  const options = collections.map((collection) => ({
    label: collection.name,
    value: collection.id,
  }));

  const { startUpload, isUploading } = useUploadThing("products");

  const { mutate, isLoading } = useServerAction(updateProductAction);

  const onSubmit = () => {
    mutate(form.getValues(), {
      async onSuccess(data) {
        if (selectedFiles.length > 0) {
          await startUpload(selectedFiles, { product: String(data?.id) });
        }

        toast({
          title: "Produto alterado",
          description: "Seu produto foi alterado",
          className: "shadow-none p-3",
        });

        router.push(`/products`);
      },
      onError: () => {
        toast({
          title: "Ops, alguma coisa deu errado",
          description: "Não conseguimos alterar seu produto no momento.",
          className: "shadow-none p-3",
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" action={onSubmit}>
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
                    defaultSelected={selectedCollections}
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
                  files={[
                    ...product.images.map((image) => image.url),
                    ...selectedFiles,
                  ]}
                  onRemoveFile={(file) => {
                    const isString = typeof file === "string";

                    if (isString) {
                      const image = product.images.find((i) => file === i.url);

                      images.mutate(
                        {
                          id: image?.id ?? "",
                          key: image?.key ?? "",
                        },
                        {
                          onSuccess: () => router.refresh(),
                        },
                      );
                    }

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
              initialValue={product.description ?? ""}
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
          {isLoading || isUploading ? "Alterando..." : "Alterar Produto"}
        </Button>
      </form>
    </Form>
  );
}
