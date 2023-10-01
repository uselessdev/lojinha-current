"use client";

import * as React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import NextImage from "next/image";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  MoreHorizontal,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "~/components/ui/alert-dialog";
import { type Collection, type Image, type Product } from "@prisma/client";
import { archiveProductAction } from "../actions/archive-product-action";
import { restoreProductAction } from "../actions/restore-product-action";
import { destroyProductAction } from "../actions/destroy-product-action";
import { useDisclosure } from "~/lib/hooks/use-disclosure";
import { useServerAction } from "~/lib/actions/use-action";

type ProductWithCollection = Product & {
  collections: Collection[];
  images: Image[];
};

type Props = {
  products: ProductWithCollection[];
};

const column = createColumnHelper<ProductWithCollection>();

export function ListProductsTable({ products }: Props) {
  const [updating, setUpdating] = React.useState<string>();
  const { isOpen, onClose, onOpen } = useDisclosure();

  const archive = useServerAction(archiveProductAction);
  const restore = useServerAction(restoreProductAction);
  const destroy = useServerAction(destroyProductAction);

  const columns = [
    column.accessor(({ name, deletedAt }) => ({ name, deletedAt }), {
      header: "Produto",
      cell(props) {
        const { name, deletedAt } = props.getValue();

        return (
          <div className="flex items-center gap-2">
            {deletedAt ? <Badge variant="outline">Arquivado</Badge> : null}
            <p className="font-medium">{name}</p>
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
                alt="Imagem adicionanda neste produto."
                width={40}
                height={40}
                className="h-10 w-10 rounded-md object-cover object-center"
              />
            ))}
          </div>
        );
      },
    }),
    column.accessor("collections", {
      header: "Coleções",
      cell(props) {
        const collections = props.getValue();

        return (
          <div className="flex flex-wrap gap-2">
            {collections.map((collection) => (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                key={collection.id}
              >
                <Link href={`/collections/${collection.id}`}>
                  {collection.name}
                </Link>
              </Badge>
            ))}
          </div>
        );
      },
    }),
    column.accessor("price", {
      header: "Preço (R$)",
      cell(props) {
        const price = props.getValue();

        if (price) {
          return formatter.currency(price);
        }
      },
    }),
    column.accessor("originalPrice", {
      header: "Preço Original (R$)",
      cell(props) {
        const price = props.getValue();

        if (price) {
          return formatter.currency(price);
        }
      },
    }),
    column.accessor("quantity", {
      header: "Quantidade",
    }),
    column.accessor(({ id, deletedAt }) => ({ id, deletedAt }), {
      id: "action",
      header: "",
      cell({ row }) {
        const product = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <span className="sr-only">Abrir Menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild className="flex gap-2">
                  <Link href={`/products/${product.id}`}>
                    <PenIcon className="h-3 w-3" /> Editar
                  </Link>
                </DropdownMenuItem>

                {product.deletedAt ? (
                  <DropdownMenuItem
                    className="flex gap-2"
                    onClick={() => {
                      setUpdating(product.id);

                      restore.mutate(
                        { id: product.id },
                        {
                          onSuccess() {
                            toast({
                              title: "Produto restaurado.",
                              description: `O produto ${product.name} foi restaurado.`,
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
                      setUpdating(product.id);

                      archive.mutate(
                        { id: product.id },
                        {
                          onSuccess() {
                            toast({
                              title: "Produto arquivado.",
                              description: `O produto ${product.name} foi arquivado`,
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
                    setUpdating(product.id);
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
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="border-0 hover:bg-transparent">
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
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Este produto será excluido de forma permanente e não poderá ser
              recuperado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              disabled={destroy.isLoading}
              onClick={() => {
                destroy.mutate(
                  { id: updating as string },
                  {
                    onSuccess: () => {
                      toast({
                        title: "Produto excluido",
                        description: `O produto foi excluido.`,
                        className: "shadow-none p-3",
                      });

                      setUpdating(undefined);
                      onClose();
                    },
                    onError: () => {
                      toast({
                        title: "Ocorreu um problema",
                        description: `O produto não pode ser excluido no momento.`,
                        className: "shadow-none p-3",
                      });
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
