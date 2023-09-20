"use client";

import { type Address, type Customer, type Order } from "@prisma/client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { BoxIcon, HomeIcon, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

type CustomerWithAddressAndOrder = Customer & {
  addresses: Address[];
  orders: Order[];
};

type Props = {
  customers: CustomerWithAddressAndOrder[];
};

const column = createColumnHelper<CustomerWithAddressAndOrder>();

export function ListCustomers({ customers }: Props) {
  const columns = [
    column.accessor("email", {
      header: "E-mail",
    }),
    column.accessor("externalId", {
      header: "ID Externo",
    }),
    column.accessor("createdAt", {
      header: "Cadastro em",
      cell(props) {
        const data = props.getValue();
        return formatter.date(data);
      },
    }),
    column.accessor(
      ({ id, addresses, orders }) => ({ id, addresses, orders }),
      {
        header: "",
        id: "actions",
        cell(props) {
          const { id, addresses, orders } = props.getValue();

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
                  <DropdownMenuItem
                    asChild
                    className="flex gap-2"
                    disabled={addresses.length <= 0}
                  >
                    <Link href={`/customers/${id}/addresses`}>
                      <HomeIcon className="h-3 w-3" /> Endereços
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    asChild
                    className="flex gap-2"
                    disabled={orders.length <= 0}
                  >
                    <Link href={`/customers/${id}/orders`}>
                      <BoxIcon className="h-3 w-3" /> Pedidos
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ),
  ];

  const table = useReactTable({
    data: customers,
    columns,
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
