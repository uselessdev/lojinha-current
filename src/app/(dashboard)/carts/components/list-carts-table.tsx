"use client";

import {
  type ProductOption,
  type Customer,
  type Order,
  type Product,
  type ProductVariants,
} from "@prisma/client";
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
  customer: Customer | null;
  products: Array<{
    price: number;
    quantity: number;
    product: Product & { variants: ProductVariants[] };
    option: ProductOption;
  }>;
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
            {products.map(({ option, product, quantity }) => {
              const variants = product.variants.filter(({ values }) =>
                values.some((value) => option.name.includes(value)),
              );

              const selected = variants.map((variant) => ({
                name: variant.name,
                value: variant.values.find((value) =>
                  option.name.includes(value),
                ),
              }));

              return (
                <Badge key={product.id}>
                  <Link href={`/products/${product.id}`}>
                    <small className="text-zinc-400">{quantity}x</small>{" "}
                    {product.name}
                    {option.name !== "default" ? (
                      <span className="pl-1 text-xs font-normal">
                        (
                        {selected
                          .map((e) => `${e.name}: ${e.value}`)
                          .join(" | ")}
                        )
                      </span>
                    ) : null}
                  </Link>
                </Badge>
              );
            })}
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
