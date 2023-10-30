"use client";

import { type Collection } from "@prisma/client";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { type ProductSchema, productSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useEffect, useState } from "react";
import { Editor } from "~/components/editor";
import slugify from "slugify";
import { Autocomplete } from "~/components/autocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { InputUpload } from "~/components/input-upload";
import { formatter } from "~/lib/utils";
import { useUploadThing } from "~/lib/uploadthing";
import { useServerAction } from "~/lib/actions/use-action";
import { createProductAction } from "../actions/create-product-action";
import { toast } from "~/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { ProductVariantValues } from "./product-variant-values";
import { cartesian } from "../utils";

type Props = {
  collections: Collection[];
};

export function CreateProductForm({ collections }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const router = useRouter();

  const form = useForm<ProductSchema>({
    mode: "onBlur",
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      collections: [],
      status: "DRAFT",
      variants: [],
      options: [],
    },
  });

  const { startUpload, isUploading } = useUploadThing("products");
  const { mutate, isLoading } = useServerAction(createProductAction);

  const onSubmit = () => {
    mutate(form.getValues(), {
      async onSuccess(data) {
        if (selectedFiles.length > 0) {
          await startUpload(selectedFiles, { product: String(data?.id) });
        }

        toast({
          title: "Novo Produto.",
          description: "Seu produto foi adicionado.",
          className: "shadow-none p-3",
        });

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

  const variants = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const watched = useWatch({
    control: form.control,
    name: "variants",
    defaultValue: [],
  });

  useEffect(() => {
    const options = cartesian(...watched.map(({ values }) => values)).map(
      (option) => option.join(`/`),
    );

    if (options.every(Boolean)) {
      form.setValue(
        `options`,
        options.map((option) => ({
          name: option,
          price: "",
          originalPrice: "",
          quantity: 1,
        })),
      );
    }
  }, [watched, form]);

  const options = collections.map(({ id, name }) => ({
    label: name,
    value: id,
  }));

  return (
    <Form {...form}>
      <form className="space-y-4" action={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Novo Produto</CardTitle>
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
                  className="space-y-6 border-b pt-6 first:pt-0 last:border-b-0"
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
                  <div key={option.join("-")} className="flex gap-2">
                    <FormField
                      name={`options.${index}.name`}
                      render={({ field }) => {
                        return (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Nome"
                                defaultValue={option.join(`/`)}
                              />
                            </FormControl>
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      name={`options.${index}.price`}
                      render={({ field }) => {
                        return (
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
                        );
                      }}
                    />

                    <FormField
                      name={`options.${index}.originalPrice`}
                      render={({ field }) => {
                        return (
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
                        );
                      }}
                    />

                    <FormField
                      name={`options.${index}.quantity`}
                      render={({ field }) => {
                        return (
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
                        );
                      }}
                    />

                    <FormField
                      name={`options.${index}.sku`}
                      render={({ field }) => {
                        return (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input {...field} placeholder="SKU" />
                            </FormControl>
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                ),
              )}
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-sm text-foreground">
                Produto sem nenhuma variação.
              </p>
            </CardContent>
          )}
        </Card>

        <Button
          className="sticky bottom-4 w-full"
          type="submit"
          aria-disabled={isLoading || isUploading || !form.formState.isValid}
        >
          {isLoading || isUploading ? "Criando..." : "Criar Produto"}
        </Button>
      </form>
    </Form>
  );
}
