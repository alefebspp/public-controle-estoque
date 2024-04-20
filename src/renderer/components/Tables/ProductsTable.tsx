import { useState, useEffect } from 'react';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
  DownloadIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons';

import {
  FilterFn,
  SortingState,
  Table,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';

import DebouncedInput from '../Input/DebounceFilter';
import Button from '../Button/Button';

import { Product } from '../../types/types';

import { ProductsTableProps, ProductsTableHeaderProps } from './interface';
import { showLoadingToast, dismissLoadingToast } from '../../lib/show-toast';
import { applyCurrency } from '../../lib/masks';
import { generatePdf, generateExcel } from '../../lib/util';
import { compareTextsWithNumbers } from '../../lib/helpers/sorts';
import useProductsColumns from '../../hooks/useProductColumns';

const ProductsTable = ({ products, showTotal = false }: ProductsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const { selectedProducts, getColumns, isPending } = useProductsColumns({
    showTotal,
  });

  const userHasProducts = products.length > 0;

  const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);

    addMeta({
      itemRank,
    });

    return itemRank.passed;
  };

  const table = useReactTable({
    data: products,
    columns: getColumns(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: fuzzyFilter,
  });

  useEffect(() => {
    if (isPending) {
      showLoadingToast('Excluindo...');
    } else {
      dismissLoadingToast();
    }
  }, [isPending]);

  return (
    <div className="w-full h-full flex flex-col">
      <ProductsTableHeader
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        downloadData={showTotal}
        products={selectedProducts}
      />
      <div className="md:max-h-[300px] lg:max-h-[400px] 2xl:max-h-[700px] overflow-y-auto">
        <table className="w-full text-sm text-left rtl:text-right overflow-y-auto text-gray-500 dark:text-gray-400">
          <thead className="text-xs sticky top-0 text-graphite-500 uppercase bg-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th scope="col" className="px-6 py-3" key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? 'cursor-pointer select-none flex'
                            : '',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: <ArrowUpIcon />,
                          desc: <ArrowDownIcon />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr className="bg-white border-b border-gray-200" key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    scope="row"
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {userHasProducts && <ProductsTablePagination table={table} />}
    </div>
  );
};

const ProductsTableHeader = ({
  globalFilter,
  setGlobalFilter,
  downloadData,
  products,
}: ProductsTableHeaderProps) => {
  const showExtraInfos = products.length > 0;

  let total: number = 0;

  const tableData = products
    .sort((a, b) => compareTextsWithNumbers(a.description, b.description))
    ?.map((product) => {
      const productTotal = product.sell_value * product.stock_quantity;
      total += productTotal;
      return [
        product.description,
        product.stock_quantity,
        applyCurrency(productTotal),
      ];
    });

  const tableTitle = `Gerado pelo sistema Controle de estoque`;
  const tableFooter = [[`Total: ${applyCurrency(total)}`]];
  const tableHeaders = [['Descrição', 'Qtd. estoque', 'Total']];
  const fileName = 'relatorio_geral';

  return (
    <div className="w-full py-[15px] flex justify-start items-start gap-[30px]">
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-graphite-400">
          Buscar
        </label>
        <DebouncedInput
          value={globalFilter ?? ''}
          onChange={(value) => setGlobalFilter(String(value))}
          className="w-[250px] min-w-[250px]"
          name="description"
          placeholder="Procurar"
        >
          <MagnifyingGlassIcon className="mr-2" />
        </DebouncedInput>
      </div>
      {downloadData && showExtraInfos ? (
        <>
          <div className="flex flex-col justify-between h-full">
            <label className="text-sm font-semibold text-graphite-400">
              PDF
            </label>
            <Button
              onClick={() =>
                generatePdf({
                  tableData,
                  tableHeaders,
                  tableTitle,
                  fileName,
                  tableFooter,
                })
              }
              size="sm"
              variant="outline"
            >
              <DownloadIcon className="mr-2" /> Baixar
            </Button>
          </div>
          <div className="flex flex-col justify-between h-full">
            <label className="text-sm font-semibold text-graphite-400">
              Excel
            </label>
            <Button
              onClick={() =>
                generateExcel({
                  tableBody: tableData,
                  tableHeader: tableHeaders[0],
                  sheet: fileName,
                  fileName,
                })
              }
              size="sm"
              variant="outline"
            >
              <DownloadIcon className="mr-2" /> Baixar
            </Button>
          </div>
        </>
      ) : null}
      {total && showExtraInfos ? (
        <div className="flex flex-col h-full">
          <label className="text-sm font-semibold text-graphite-400">
            Total em produtos
          </label>
          <h3 className="text-xl font-semibold m-auto">
            {applyCurrency(total)}
          </h3>
        </div>
      ) : null}
    </div>
  );
};

const ProductsTablePagination = ({ table }: { table: Table<Product> }) => {
  return (
    <div className="py-[15px] flex items-center justify-center gap-2">
      <button
        className="border rounded p-1"
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
      >
        <DoubleArrowLeftIcon />
      </button>
      <button
        className="border rounded p-1"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeftIcon />
      </button>
      <button
        className="border rounded p-1"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <ChevronRightIcon />
      </button>
      <button
        className="border rounded p-1"
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
      >
        <DoubleArrowRightIcon />
      </button>
      <span className="flex items-center gap-1">
        <div>Página</div>
        <strong>
          {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </strong>
      </span>
      <span className="flex items-center gap-1">
        | Ir para página:
        <input
          type="number"
          defaultValue={table.getState().pagination.pageIndex + 1}
          onChange={(e) => {
            const page = e.target.value ? Number(e.target.value) - 1 : 0;
            table.setPageIndex(page);
          }}
          className="border p-1 rounded w-16"
        />
      </span>
    </div>
  );
};

export default ProductsTable;
