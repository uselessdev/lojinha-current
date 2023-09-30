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
import { useUploadThing } from "~/lib/uploadthing";
import { type CollectionSchema, collectionSchema } from "../schema";
import { useOrganization } from "@clerk/nextjs";
import { type Image, type Collection } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "~/components/ui/use-toast";
import { updateCollectionAction } from "../actions/update-collection-action";
import { deleteImagesAction } from "../actions/delete-images-action";
import { useServerAction } from "~/lib/actions/use-action";

type CollectionWithParentAndImage = Collection & {
  parents: Collection[];
  images: Image[];
};

type Props = {
  collection: CollectionWithParentAndImage;
  collections: Collection[];
};

export function UpdateCollectionForm({ collections, collection }: Props) {
  const { organization } = useOrganization();

  const { mutate, isLoading } = useServerAction(updateCollectionAction);

  const images = useAction(deleteImagesAction);
  const router = useRouter();

  const form = useForm<CollectionSchema>({
    mode: "all",
    defaultValues: {
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description ?? "",
    },
    resolver: zodResolver(collectionSchema),
  });

  const [selectedFiles, setSelectedFiles] = useState<Array<File>>([]);
  const { startUpload, isUploading } = useUploadThing("collections");

  const options = collections.map((collection) => ({
    value: collection.id,
    label: collection.name,
  }));

  const selected = collection.parents.map((collection) => ({
    value: collection.id,
    label: collection.name,
  }));

  const onSubmit = () => {
    mutate(form.getValues(), {
      async onSuccess(data) {
        if (selectedFiles.length > 0) {
          await startUpload(selectedFiles, { collection: data?.id as string });
        }

        toast({
          title: "Coleção Alterada",
          description: `A coleção ${data?.name} foi alterada.`,
          className: "shadow-none p-3",
        });

        router.push("/collections");
      },
      onError: () => {
        toast({
          title: "Erro",
          description:
            "Ocorreu um erro ao tentar alterar sua coleção, tente novamente.",
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
                  files={[
                    ...collection.images.map((image) => image.url),
                    ...selectedFiles,
                  ]}
                  onRemoveFile={(file) => {
                    const isString = typeof file === "string";

                    if (isString) {
                      const image = collection.images.find(
                        (i) => file === i.url,
                      );

                      images.mutate(
                        {
                          id: image?.id ?? "",
                          key: image?.key ?? "",
                          store: String(organization?.id),
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
          name="parents"
          render={() => {
            return (
              <FormItem>
                <FormLabel>Coleções</FormLabel>
                <FormControl>
                  <Autocomplete
                    options={options}
                    defaultSelected={selected}
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
              initialValue={field.value}
              onChange={({ html }) => form.setValue("description", html)}
            />
          )}
        />

        <Button type="submit" size="sm" disabled={isUploading || isLoading}>
          {isUploading || isLoading ? "Salvando..." : "Alterar Coleção"}
        </Button>
      </form>
    </Form>
  );
}
