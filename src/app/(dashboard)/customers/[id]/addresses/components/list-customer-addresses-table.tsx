"use client";

import { type Address } from "@prisma/client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type Props = {
  addresses: Address[];
};

const column = createColumnHelper<Address>();

export function ListCustomerAddresses({ addresses }: Props) {
  const columns = [
    column.accessor("alias", {
      header: "Nome",
    }),
    column.accessor("zipcode", {
      header: "CEP",
    }),
    column.accessor("id", {
      header: "Endereço",
      cell(props) {
        const address = props.row.original;

        return (
          <p className="text-sm font-medium">
            {address.street}, {address.number} - {address.city}, {address.state}{" "}
            <span className="text-zinc-400">({address.complement})</span>
          </p>
        );
      },
    }),
  ];

  const table = useReactTable({
    columns,
    data: addresses,
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
