"use client";

import { type Address, type Customer, type Order } from "@prisma/client";
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
    column.accessor("orders", {
      header: "Pedidos",
      cell(props) {
        const orders = props.getValue();

        return (
          <div className="flex flex-wrap gap-2">
            {orders.map((order) => (
              <Badge key={order.id} variant="secondary">
                <Link href={`/orders/${order.id}`}>
                  #{order.id.slice(0, 8)}
                </Link>
              </Badge>
            ))}
          </div>
        );
      },
    }),
    column.accessor("addresses", {
      header: "Endereços",
      cell(props) {
        const addresses = props.getValue();

        return (
          <div className="flex flex-wrap gap-2">
            {addresses.map((address) => (
              <Badge key={address.id} variant="secondary">
                <Link href={`/addresses/${address.id}`}>
                  {address.alias ?? address.street}
                </Link>
              </Badge>
            ))}
          </div>
        );
      },
    }),
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
