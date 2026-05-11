import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "../../lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Helper to format column IDs to fallback titles if header is a component/function
  const formatColumnId = (id: string) => {
    return id
      .replace(/([A-Z])/g, " $1")
      .replace(/^[a-z]/, (str) => str.toUpperCase())
      .replace(/[_-]/g, " ")
      .trim();
  };

  return (
    <div className="w-full">
      {/* 1. MOBILE LAYOUT: Adaptive Stacked Cards (Hidden on desktop) */}
      <div className="block lg:hidden space-y-4">
        {table.getRowModel().rows?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                className="bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm space-y-3.5 transition-all hover:border-indigo-100"
              >
                {row.getVisibleCells().map((cell) => {
                  // Retrieve header label for metadata
                  const headerGroup = table.getHeaderGroups()[0];
                  const headerEl = headerGroup?.headers.find(
                    (h) => h.column.id === cell.column.id
                  );
                  const headerLabel = headerEl?.isPlaceholder
                    ? null
                    : headerEl?.column.columnDef.header;

                  const columnTitle = typeof headerLabel === "string" 
                    ? headerLabel 
                    : formatColumnId(cell.column.id);

                  return (
                    <div
                      key={cell.id}
                      className="flex justify-between items-center gap-4 py-1.5 border-b border-neutral-100/50 last:border-b-0 min-w-0"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 whitespace-nowrap flex-shrink-0">
                        {columnTitle}
                      </span>
                      <div className="text-sm font-medium text-neutral-800 text-right min-w-0 break-words flex-1 flex justify-end">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-neutral-200/60 rounded-2xl p-8 text-center text-neutral-400 text-sm shadow-sm">
            Nenhum registro encontrado.
          </div>
        )}
      </div>

      {/* 2. DESKTOP LAYOUT: Traditional TanStack Table (Hidden on mobile/tablet) */}
      <div className="hidden lg:block rounded-2xl border border-neutral-200/60 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 font-bold tracking-wider text-neutral-400"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-indigo-50/10 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-28 text-center text-neutral-500 font-medium"
                  >
                    Nenhum resultado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
