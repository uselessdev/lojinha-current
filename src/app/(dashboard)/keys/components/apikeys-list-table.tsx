"use client";

import * as React from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { CopyIcon, EyeIcon, EyeOffIcon, Trash2Icon } from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { formatter } from "~/lib/utils";
import { toast } from "~/components/ui/use-toast";
import { type Key, type UnkeyResponse } from "../utils/fetch-api-keys";
import { useClipboard } from "~/lib/hooks/use-clipboard";
import { createApiKeyAction } from "../actions/create-api-key-action";
import { revokeApiKeyAction } from "../actions/revoke-api-key-action";
import { useServerAction } from "~/lib/actions/use-action";

type Props = {
  keys: UnkeyResponse;
};

const column = createColumnHelper<Key>();

export function ApiKeysList(props: Props) {
  const [copied, copy] = useClipboard();
  const [isOpen, setIsOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<string>("");
  const [visible, toggleVisible] = React.useReducer((state) => !state, false);
  const [keyToRevoke, setKeyToRevoke] = React.useState<string>();
  const [revokeModal, setRevokeModal] = React.useState(false);

  const create = useServerAction(createApiKeyAction);
  const revoke = useServerAction(revokeApiKeyAction);

  const handleCopyKeyAndCloseModal = async () => {
    await copy(preview ?? "");

    setTimeout(() => {
      setPreview("");
      setIsOpen(false);
    }, 600);
  };

  const columns = [
    column.accessor("start", {
      header: "Chave",
      cell(props) {
        return <Badge variant="secondary">{props.getValue()}...</Badge>;
      },
    }),
    column.accessor("meta", {
      header: "Tipo",
      cell(props) {
        const meta = props.getValue();
        return meta.mode === "read" ? "Pública" : "Secreta";
      },
    }),
    column.accessor("createdAt", {
      header: "Criada em:",
      cell(props) {
        return formatter.date(new Date(props.getValue()));
      },
    }),
    column.accessor("expires", {
      header: "Expira em:",
      cell(props) {
        const expires = props.getValue();

        if (!expires) {
          return null;
        }

        return formatter.date(new Date(expires));
      },
    }),
    column.accessor("id", {
      header: "",
      cell(props) {
        return (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setKeyToRevoke(props.getValue());
                setRevokeModal(true);
              }}
            >
              <span className="sr-only">Revogar Chave</span>
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: props.keys.keys,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <Card className="pb-6">
        <CardHeader className="flex w-full flex-row justify-between">
          <div className="space-y-1.5">
            <CardTitle>Chaves de API</CardTitle>
            <CardDescription>
              Suas chaves de API para acessar seus dados em suas aplicações.
            </CardDescription>
          </div>

          <Button
            size="sm"
            disabled={create.isLoading}
            onClick={() => {
              create.mutate(undefined, {
                onSuccess(data) {
                  setPreview(data as string);
                  setIsOpen(true);
                },
                onError: (error) => console.log(error),
              });
            }}
          >
            {create.isLoading ? "Criando..." : "Criar Chave"}
          </Button>
        </CardHeader>

        {props.keys.total > 0 ? (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow
                  key={group.id}
                  className="border-0 hover:bg-transparent"
                >
                  {group.headers.map((header) => (
                    <TableHead key={header.id} className="uppercase ">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </Card>

      <AlertDialog open={isOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nova chave</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Sua chave de API foi criada com sucesso! Sua chave de API serve
                para acessar seus produtos e coleções e criar carrinhos e
                pedidos,{" "}
                <strong>
                  essa é a única vez que você poderá ver essa chave, mantenha
                  ela em um lugar seguro.
                </strong>
              </p>
              <div className="flex items-center justify-between rounded-md bg-foreground/5 p-2">
                <pre>
                  {visible
                    ? preview
                    : preview.slice(0, 7).padEnd(preview.length, "*")}
                </pre>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleVisible()}
                >
                  {visible ? (
                    <EyeIcon className="h-4 w-4" />
                  ) : (
                    <EyeOffIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction
              className="gap-2"
              // eslint-disable-next-line
              onClick={() => handleCopyKeyAndCloseModal()}
            >
              <span className="sr-only">copiar chave</span>
              <CopyIcon className="h-4 w-4" />{" "}
              {copied ? "Copiado!" : "Copiar Chave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={revokeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar chave</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Ao revogar essa chave, suas aplicações que utilizam essa chave
                não terão mais acesso aos seus dados.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setKeyToRevoke(undefined);
                setRevokeModal(false);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={revoke.isLoading}
              onClick={() => {
                revoke.mutate(
                  { key: String(keyToRevoke) },
                  {
                    onSuccess: () => {
                      toast({
                        title: "Chave revogada",
                        description:
                          "Sua chave foi revogada, não se esqueça de atualizar suas aplicações para utilzar uma chave nova.",
                        className: "shadow-none p-3",
                      });

                      setKeyToRevoke(undefined);
                      setRevokeModal(false);
                    },
                  },
                );
              }}
            >
              {revoke.isLoading ? "Revogando..." : "Revogar Chave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
