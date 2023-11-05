"use client";

import {
  type OrderStatus,
  type Order,
  type Product,
  type Customer,
  type ProductVariants,
  type ProductOption,
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

type OrderWithProducts = Order & {
  customer: Customer | null;
  products: Array<{
    price: number;
    quantity: number;
    product: Product & { variants: ProductVariants[] };
    option: ProductOption;
  }>;
};

type Props = {
  orders: OrderWithProducts[];
};

const column = createColumnHelper<OrderWithProducts>();

function getOrderStatus(status: OrderStatus) {
  switch (status) {
    case "CREATED":
      return (
        <Badge className="bg-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-500">
          Aguardando Pagamento
        </Badge>
      );
    default:
      break;
  }
}

export function ListCustomerOrders({ orders }: Props) {
  const columns = [
    column.accessor("id", {
      header: "Pedido",
      cell(props) {
        const id = props.getValue();

        return <Badge variant="secondary">#{id.slice(0, 8)}</Badge>;
      },
    }),
    column.accessor("status", {
      header: "Status",
      cell(props) {
        return getOrderStatus(props.getValue());
      },
    }),
    column.accessor("customer.email", {
      header: "Cliente",
    }),
    column.accessor("price", {
      header: "Valor (R$)",
      cell(props) {
        const value = props.getValue();
        return formatter.currency(Number(value ?? 0));
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
    column.accessor("createdAt", {
      header: "Criado em",
      cell(props) {
        return formatter.date(props.getValue());
      },
    }),
  ];

  const table = useReactTable({
    columns,
    data: orders,
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
