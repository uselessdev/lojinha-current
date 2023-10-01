"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { type Collection, type Image } from "@prisma/client";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  MoreHorizontal,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { formatter } from "~/lib/utils";
import NextImage from "next/image";
import { archiveCollectionAction } from "../actions/archive-collection-action";
import { toast } from "~/components/ui/use-toast";
import { restoreCollectionAction } from "../actions/restore-collection-action";
import { useState } from "react";
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
import { useDisclosure } from "~/lib/hooks/use-disclosure";
import { destroyCollectionAction } from "../actions/destroy-collection-action";
import { useServerAction } from "~/lib/actions/use-action";

type CollectionWithParentsAndImages = Collection & {
  parents: Collection[];
  images: Image[];
};

type Props = {
  collections: CollectionWithParentsAndImages[];
};

const column = createColumnHelper<CollectionWithParentsAndImages>();

export function ListCollectionsTable({ collections }: Props) {
  const [updating, setUpdating] = useState<string>();

  const archive = useServerAction(archiveCollectionAction);
  const restore = useServerAction(restoreCollectionAction);
  const destroy = useServerAction(destroyCollectionAction);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const columns = [
    column.accessor(({ name, deletedAt }) => ({ name, deletedAt }), {
      header: "Coleção",
      cell(props) {
        const { name, deletedAt } = props.getValue();

        return (
          <div className="flex items-center gap-2">
            {deletedAt ? <Badge variant="outline">Arquivada</Badge> : null}

            <p className="font-medium">{name}</p>
          </div>
        );
      },
    }),
    column.accessor("parents", {
      header: "",
      cell(props) {
        const parents = props.getValue();

        return (
          <div className="flex gap-2">
            {parents.map((parent) => (
              <Badge key={parent.id}>{parent.name}</Badge>
            ))}
          </div>
        );
      },
    }),
    column.accessor("images", {
      header: "Imagens",
      cell(props) {
        const images = props.getValue();

        return (
          <div className="flex flex-wrap gap-2">
            {images.map((image) => (
              <NextImage
                src={image.url}
                key={image.id}
                alt="Imagem adicionanda nesta coleção."
                width={40}
                height={40}
                className="h-10 w-10 rounded-md object-cover object-center"
              />
            ))}
          </div>
        );
      },
    }),
    column.accessor("createdAt", {
      header: "Criada em",
      cell(props) {
        return formatter.date(props.getValue());
      },
    }),
    column.accessor(({ id, deletedAt }) => ({ id, deletedAt }), {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const collection = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <span className="sr-only">abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild className="flex gap-2">
                  <Link href={`/collections/${collection.id}`}>
                    <PenIcon className="h-3 w-3" /> Editar
                  </Link>
                </DropdownMenuItem>

                {collection.deletedAt ? (
                  <DropdownMenuItem
                    className="flex gap-2"
                    onClick={() => {
                      setUpdating(collection.id);

                      restore.mutate(
                        { id: collection.id },
                        {
                          onSuccess: () => {
                            toast({
                              title: "Coleção restaurada.",
                              description: `A coleção ${collection.name} foi restaurada.`,
                              className: "shadow-none p-3",
                            });

                            setUpdating(undefined);
                          },
                        },
                      );
                    }}
                  >
                    <ArchiveRestoreIcon className="h-4 w-4 text-gray-500" />
                    Restaurar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="flex gap-2"
                    onClick={() => {
                      setUpdating(collection.id);

                      archive.mutate(
                        { id: collection.id },
                        {
                          onSuccess: () => {
                            toast({
                              title: "Coleção arquivada.",
                              description: `A coleção ${collection.name} foi arquivada.`,
                              className: "shadow-none p-3",
                            });

                            setUpdating(undefined);
                          },
                        },
                      );
                    }}
                  >
                    <ArchiveIcon className="h-3 w-3 text-gray-500" />
                    Arquivar
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="group flex gap-2 text-red-500"
                  onClick={() => {
                    setUpdating(collection.id);
                    onOpen();
                  }}
                >
                  <Trash2Icon className="h-4 w-4 text-red-500" />
                  <span className="group-hover:text-red-500">Excluir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    columns,
    data: collections,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <Table className="mb-6">
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="border-0 hover:bg-transparent">
              {group.headers.map((header) => (
                <TableHead key={header.id} className="uppercase">
                  {flexRender(
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
            <TableRow
              key={row.id}
              data-state={
                (archive.isLoading || restore.isLoading) &&
                row.original.id === updating
                  ? "loading"
                  : ""
              }
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={isOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coleção</AlertDialogTitle>
            <AlertDialogDescription>
              Essa coleção será excluida de forma permanente e não poderá ser
              recuperada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onClose}>
              Não quero excluir
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={destroy.isLoading}
              onClick={() => {
                destroy.mutate(
                  { id: String(updating) },
                  {
                    onSuccess: () => {
                      toast({
                        title: "Coleção excluida.",
                        description: `A coleção foi excluida.`,
                        className: "shadow-none p-3",
                      });

                      setUpdating(undefined);
                      onClose();
                    },
                  },
                );
              }}
            >
              {destroy.isLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
