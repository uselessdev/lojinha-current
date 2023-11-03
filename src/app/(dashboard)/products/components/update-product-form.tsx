"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type ProductSchema, productSchema } from "../schema";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Product,
  type Collection,
  type Image,
  type ProductVariants,
  type ProductOption,
} from "@prisma/client";
import { useUploadThing } from "~/lib/uploadthing";
import { updateProductAction } from "../actions/update-product-action";
import { toast } from "~/components/ui/use-toast";
import {
  Form,
  FormControl,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { ProductVariantValues } from "./product-variant-values";
import { cartesian } from "../utils";

type Props = {
  collections: Collection[];
  product: Product & {
    collections: Collection[];
    images: Image[];
    variants: ProductVariants[];
    options: ProductOption[];
  };
};

export function UpdateProductForm({ collections, product }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const images = useServerAction(deleteImagesAction);
  const router = useRouter();

  const defaultProductOption = product.options
    .map(({ price, originalPrice, quantity, sku, ...option }) => ({
      ...option,
      price: formatter.currency(price ?? 0),
      originalPrice: formatter.currency(originalPrice ?? 0),
      quantity: quantity ?? 0,
      sku: sku ?? "",
    }))
    .find(({ name }) => name === "default");

  const defaultProductVariants = product.variants.find(
    ({ name }) => name === "default",
  );

  const customProductVariants = product.variants.filter(
    ({ name }) => name !== "default",
  );

  const customProductOptions = product.options.filter(
    ({ name }) => name !== "default",
  );

  const form = useForm<ProductSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: product.id,
      status: product.status,
      name: product.name,
      slug: product.slug,
      description: String(product.description),
      price: defaultProductOption?.price,
      originalPrice: defaultProductOption?.originalPrice,
      quantity: defaultProductOption?.quantity ?? 0,
      sku: defaultProductOption?.sku ?? "",
      variants: customProductVariants,
      options: customProductOptions.map((option) => ({
        ...option,
        price: formatter.currency(option?.price ?? 0),
        originalPrice: formatter.currency(option.originalPrice ?? 0),
        quantity: option.quantity ?? 0,
        sku: option.sku ?? "",
      })),
    },
  });

  const variants = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const watched = useWatch({
    control: form.control,
    name: "variants",
    defaultValue: product.variants.filter(({ name }) => name !== "default"),
  });

  useEffect(() => {
    const options = cartesian(...watched.map(({ values }) => values)).map(
      (option) => {
        return option.every((value) => Boolean(value.trim()))
          ? option.map((value) => value.trim()).join(`/`)
          : null;
      },
    );

    form.setValue(
      `options`,
      options.filter(Boolean).map((option) => {
        const result = product.options.find(({ name }) => {
          return option.includes(name.trim());
        });

        return {
          id: result?.id ?? undefined,
          name: option,
          price: result?.price ? formatter.currency(result.price) : "",
          originalPrice: result?.originalPrice
            ? formatter.currency(result.originalPrice)
            : "",
          quantity: result?.quantity ?? 0,
          sku: result?.sku ?? "",
        };
      }),
    );
  }, [watched, form, product.options]);

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
    const values = form.getValues();

    const mergedValues = {
      ...values,
      variants: defaultProductVariants
        ? [defaultProductVariants, ...values.variants]
        : values.variants,
      options: defaultProductOption
        ? [defaultProductOption, ...values.options]
        : values.options,
    };

    mutate(mergedValues, {
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
      onError: (error) => {
        console.log(error);

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
        <Card>
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>#{product.id}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
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
                          slugify(String(target.value), {
                            lower: true,
                            trim: true,
                          }),
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
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Editor
                      label="Descrição"
                      {...field}
                      initialValue={product.description ?? ""}
                      onChange={({ html }) =>
                        form.setValue("description", html)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-medium">Organização e Visibilidade</h3>
          </CardHeader>

          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="collections"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coleções</FormLabel>
                  <FormControl>
                    <Autocomplete
                      options={options}
                      defaultSelected={selectedCollections}
                      {...field}
                      onChange={({ target }) => {
                        form.setValue(
                          "collections",
                          target.value.map(({ value }) => value),
                        );
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-medium">Imagens</h3>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              // @ts-expect-error name is not from schema
              name="cover"
              render={() => (
                <FormItem>
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
                          const image = product.images.find(
                            (i) => file === i.url,
                          );

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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-medium">Preço e Estoque</h3>
          </CardHeader>

          <CardContent className="flex w-full gap-4">
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
                        form.setValue(
                          "quantity",
                          formatter.number(target.value),
                        )
                      }
                      type="number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-medium">Variantes</h3>
          </CardHeader>

          {variants.fields.length > 0 ? (
            <div>
              {variants.fields.map((variant, index) => (
                <CardContent
                  key={variant.id}
                  className="space-y-6 border-b pt-6 first:pt-0 last:border-0"
                >
                  <FormField
                    name={`variants.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex gap-2 space-y-0">
                        <FormControl>
                          <Input {...field} placeholder="Nome" />
                        </FormControl>
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          onClick={() => variants.remove(index)}
                        >
                          <Trash2Icon />
                          <span className="sr-only">Remover Variação</span>
                        </Button>
                      </FormItem>
                    )}
                  />

                  <ProductVariantValues index={index} />
                </CardContent>
              ))}
            </div>
          ) : null}

          <CardFooter className="border-t py-0">
            <Button
              type="button"
              variant="link"
              className="gap-2 px-0 hover:text-zinc-500 hover:no-underline"
              onClick={() => variants.append({ name: "", values: [" "] })}
            >
              <PlusIcon /> Adicionar Variante
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-medium">Opções</h3>
          </CardHeader>

          {watched.length > 0 ? (
            <CardContent className="space-y-3">
              {cartesian(...watched.map(({ values }) => values)).map(
                (option, index) => (
                  <div key={option.join("-")} className="flex w-full gap-3">
                    <FormField
                      name={`options.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder="Nome" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      name={`options.${index}.price`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Preço"
                              onChange={({ target }) => {
                                form.setValue(
                                  `options.${index}.price`,
                                  formatter.currency(
                                    formatter.number(target.value),
                                  ),
                                );
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      name={`options.${index}.originalPrice`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Preço Original"
                              onChange={({ target }) => {
                                form.setValue(
                                  `options.${index}.originalPrice`,
                                  formatter.currency(
                                    formatter.number(target.value),
                                  ),
                                );
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      name={`options.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Quantidade"
                              onChange={({ target }) =>
                                form.setValue(
                                  `options.${index}.quantity`,
                                  formatter.number(target.value),
                                )
                              }
                              type="number"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      name={`options.${index}.sku`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder="SKU" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                ),
              )}
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-muted-foreground">
                Adicione variantes para criar as opções
              </p>
            </CardContent>
          )}
        </Card>

        <Button
          className="sticky bottom-4 w-full"
          type="submit"
          aria-disabled={isLoading || isUploading || !form.formState.isValid}
        >
          {isLoading || isUploading ? "Alterarando..." : "Alterar Produto"}
        </Button>
      </form>
    </Form>
  );
}
