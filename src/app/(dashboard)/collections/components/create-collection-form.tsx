"use client";

import { useForm } from "react-hook-form";
import slugify from "slugify";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "~/components/ui/button";
import { Autocomplete } from "~/components/autocomplete";
import { Editor } from "~/components/editor";
import { InputUpload } from "~/components/input-upload";
import { useState } from "react";
import { useAction } from "~/lib/use-action";
import { createCollectionAction } from "../actions/create-collection-action";
import { useUploadThing } from "~/lib/uploadthing";
import { type CollectionSchema, collectionSchema } from "../schema";
import { useOrganization, useUser } from "@clerk/nextjs";

export function CreateCollectionForm() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { mutate, isLoading } = useAction(createCollectionAction);

  const form = useForm<CollectionSchema>({
    mode: "all",
    defaultValues: {
      store: organization?.id,
      user: user?.id,
      name: "",
    },
    resolver: zodResolver(collectionSchema),
  });

  const [selectedFiles, setSelectedFiles] = useState<Array<File>>([]);
  const { startUpload, isUploading } = useUploadThing("collections");

  const onSubmit = () => {
    mutate(
      {
        ...form.getValues(),
        store: String(organization?.id),
        user: String(user?.id),
      },
      {
        onSuccess: async (data) => {
          await startUpload(selectedFiles, { collection: data?.id as string });
        },
        onError: (error) => console.log(error),
      },
    );
  };

  console.log({ isLoading, isUploading });

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
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input {...field} readOnly />
              </FormControl>
              <FormDescription>
                Este campo é preenchido de forma automática.
              </FormDescription>
            </FormItem>
          )}
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
                  files={selectedFiles}
                  onRemoveFile={(file) => {
                    setSelectedFiles((files) =>
                      files.filter((f) => f.name !== file.name),
                    );
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
          name="parents"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Coleções</FormLabel>
                <FormControl>
                  <Autocomplete
                    options={[]}
                    {...field}
                    onChange={({ target }) => {
                      form.setValue(
                        "parents",
                        target.value.map(({ value }) => value),
                      );
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Coleções que esta coleção pertence. Por exemplo, você pode
                  estar criando uma coleção Camisetas que pertence a uma coleção
                  Roupas.
                </FormDescription>
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <Editor
              label="Descrição"
              {...field}
              onChange={({ html }) => form.setValue("description", html)}
            />
          )}
        />

        <Button type="submit" size="sm">
          {isUploading || isLoading ? "Criando..." : "Criar Coleção"}
        </Button>
      </form>
    </Form>
  );
}
