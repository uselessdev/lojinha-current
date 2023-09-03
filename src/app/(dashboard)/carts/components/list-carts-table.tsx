"use client";

import { type Customer, type Order, type Product } from "@prisma/client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
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

type CartWithProductAndCustomer = Order & {
  products: (Product & { order: { quantity: number; price: number } })[];
  customer: Customer | null;
};

type Props = {
  carts: CartWithProductAndCustomer[];
};

const column = createColumnHelper<CartWithProductAndCustomer>();

export function ListCarts({ carts }: Props) {
  const columns = [
    column.accessor("id", {
      header: "Carrinho",
      cell(props) {
        return (
          <Badge variant="secondary">
            #{props.getValue().split("-").at(0)}
          </Badge>
        );
      },
    }),
    column.accessor("products", {
      header: "Produtos",
      cell(props) {
        const products = props.getValue();

        return (
          <div className="flex flex-wrap gap-2">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="flex items-baseline gap-1 rounded-md bg-zinc-50 p-2 font-medium"
              >
                <small className="text-zinc-400">
                  {product.order.quantity}x
                </small>{" "}
                {product.name}
              </Link>
            ))}
          </div>
        );
      },
    }),
    column.accessor("price", {
      header: "Valor (R$)",
      cell(props) {
        return (
          <span className="font-medium">
            {formatter.currency(props.getValue() ?? 0)}
          </span>
        );
      },
    }),
    column.accessor("createdAt", {
      header: "Criado em",
      cell(props) {
        return formatter.date(props.getValue());
      },
    }),
  ];

  const table = useReactTable({
    columns,
    data: carts,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
