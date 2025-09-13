"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import type { TestRun } from "~/types"

const mockData: TestRun[] = [
  {
    id: "run-001",
    name: "Security Prompt Injection Test",
    executedOn: new Date("2024-01-15T14:30:00Z"),
    result: { passed: 45, failed: 3, error: 2 },
  },
  {
    id: "run-002", 
    name: "Jailbreak Resistance Test",
    executedOn: new Date("2024-01-15T13:15:00Z"),
    result: { passed: 23, failed: 15, error: 1 },
  },
  {
    id: "run-003",
    name: "Social Engineering Defense",
    executedOn: new Date("2024-01-15T12:00:00Z"),
    result: { passed: 38, failed: 2, error: 0 },
  },
  {
    id: "run-004",
    name: "Role-Play Attack Simulation",
    executedOn: new Date("2024-01-15T10:45:00Z"),
    result: { passed: 12, failed: 8, error: 5 },
  },
  {
    id: "run-005",
    name: "Content Filter Bypass Test",
    executedOn: new Date("2024-01-14T16:20:00Z"),
    result: { passed: 50, failed: 0, error: 0 },
  },
]


export const columns: ColumnDef<TestRun>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"  
          className="px-0"      
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "executedOn",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Executed On
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("executedOn") as Date
      return <div className="tabular-nums slashed-zero">{date.toLocaleString()}</div>
    },
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => {
      const result = row.getValue("result") as { passed: number; failed: number; error: number }
      return (
        <div className="flex gap-2 text-sm">
          <Badge variant="secondary" className="bg-green-100/90 text-black border">
            Passed: {result.passed}
          </Badge>
          <Badge variant="secondary" className="bg-red-400 border">
            Failed: {result.failed}
          </Badge>
          <Badge variant="secondary" className="bg-gray-600 ">
            Error: {result.error}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Details",
    enableHiding: false,
    cell: () => {
      return (
        <Button variant="outline" size="sm" className="text-xs">
          View Details
        </Button>
      )
    },
  },
]

interface RunsTableProps {
  data?: TestRun[]
}

export function RunsTable({ data }: RunsTableProps = {}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [fetchedData, setFetchedData] = React.useState<TestRun[]>([])

  // Fetch data if not provided as prop
  React.useEffect(() => {
    if (!data) {
      // Simulate API call with setTimeout
      setTimeout(() => {
        setFetchedData(mockData)
      }, 100)
    }
  }, [data])

  const tableData = data || fetchedData

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-md border">
        <Table className="tabular-nums slashed-zero text-sm">
          <TableHeader className="text-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="text-xs"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          Showing {table.getFilteredRowModel().rows.length} of {table.getFilteredRowModel().rows.length} entries
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
