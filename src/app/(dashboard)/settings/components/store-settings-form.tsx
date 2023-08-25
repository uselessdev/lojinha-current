"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
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
import { useOrganization, useUser } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";
import { type StoreSchema, storeSchema } from "../schema";
import { Autocomplete } from "~/components/autocomplete";
import { type Email, type Store } from "@prisma/client";
import { useAction } from "~/lib/use-action";
import { updateStoreAction } from "../actions/update-store-action";
import { toast } from "~/components/ui/use-toast";
import { useRouter } from "next/navigation";
import * as CNPJ from "@fnando/cnpj";

type Props = {
  store: (Store & { emails: Pick<Email, "address">[] }) | null;
};

export function StoreSettingsForm({ store }: Props) {
  const { organization, membershipList } = useOrganization({
    membershipList: {},
  });
  const { user } = useUser();
  const { mutate, isLoading } = useAction(updateStoreAction);
  const router = useRouter();

  const members =
    membershipList?.map((member) => ({
      label: member.publicUserData.identifier,
      value: member.publicUserData.identifier,
    })) ?? [];

  const custom =
    store?.emails.map(({ address }) => ({
      label: address,
      value: address,
    })) ?? [];

  const options = [...members, ...custom].reduce<
    Array<{ label: string; value: string }>
  >((items, item) => {
    const exists = items.some(({ label }) => label === item.label);

    if (!exists) {
      items.push(item);
    }

    return items;
  }, []);

  const form = useForm<StoreSchema>({
    mode: "all",
    defaultValues: {
      id: store?.id,
      name: organization?.name,
      emails: store
        ? store.emails.map((email) => email.address)
        : [user?.emailAddresses.at(0)?.emailAddress],
      url: store?.url,
      cnpj: store?.cnpj,
      store: String(organization?.id),
    },
    resolver: zodResolver(storeSchema),
  });

  const onSubmit: SubmitHandler<StoreSchema> = (data) => {
    mutate(data, {
      onSuccess: () => {
        toast({
          title: "Alterações Salvas",
          description: "As informações da sua loja, foram alteradas.",
          className: "shadow-none p-3",
        });

        router.refresh();
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
                <Input {...field} readOnly />
              </FormControl>
              <FormDescription>
                Para alterar o nome da sua loja, utilize o menu acima.
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
              <FormDescription>
                Link da sua loja ex: https://acme.lojinha.dev
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(event) => {
                    form.setValue("cnpj", CNPJ.format(event.target.value));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emails"
          render={() => (
            <FormItem>
              <FormLabel>E-mails</FormLabel>
              <Autocomplete
                options={options}
                defaultSelected={form.getValues("emails").map((email) => ({
                  label: email,
                  value: email,
                }))}
                onChange={({ target }) => {
                  form.setValue(
                    "emails",
                    target.value.map(({ value }) => value),
                  );
                }}
                createWhenNotExists
              />
              <FormDescription>
                Os e-mails configurados aqui serão utilizados para entrar em
                contato com você e como remetente de e-mails enviados para seus
                clientes.
              </FormDescription>
            </FormItem>
          )}
        />

        <Button disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </form>
    </Form>
  );
}
