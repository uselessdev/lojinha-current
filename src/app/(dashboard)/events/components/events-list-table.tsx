"use client";

import type { Event } from "@prisma/client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ReadableEvent } from "./readable-event";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type Props = {
  events: Event[];
};

const column = createColumnHelper<Event>();

const columns = [
  column.accessor(
    ({ action, user, createdAt }) => ({ action, user, createdAt }),
    {
      header: "Evento",
      cell(props) {
        return <ReadableEvent {...props.getValue()} />;
      },
    },
  ),
];

export function EventsListTable({ events }: Props) {
  const table = useReactTable({
    data: events,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
          <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
