import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteProduct } from './useProducts';
import { createColumnHelper } from '@tanstack/react-table';
import { MovementType, Product } from '../types/types';
import ConfirmToast from '../components/ConfirmToast/ConfirmToast';
import {
  CrossCircledIcon,
  Pencil2Icon,
  PlusIcon,
  MinusIcon,
} from '@radix-ui/react-icons';

type Props = {
  showTotal: boolean;
};

export default function useProductsColumns({ showTotal }: Props) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useDeleteProduct();
  const columnHelper = createColumnHelper<Product>();

  function getColumns() {
    if (showTotal) {
      return [
        columnHelper.accessor((row) => row, {
          id: 'product',
          cell: (info) => (
            <input
              checked={
                selectedProducts.find(
                  (product) => info.getValue().id === product.id,
                )
                  ? true
                  : false
              }
              onChange={(event) => {
                if (event.target.checked) {
                  setSelectedProducts((prev) => [info.getValue(), ...prev]);
                } else {
                  setSelectedProducts(
                    selectedProducts.filter(
                      (product) => info.getValue().id !== product.id,
                    ),
                  );
                }
              }}
              type="checkbox"
            />
          ),
          footer: (info) => info.column.id,
          header: (info) => {
            const filteredValues = info.table
              .getFilteredRowModel()
              .rows.map((row) => row.original);
            return (
              <input
                type="checkbox"
                checked={selectedProducts.length === filteredValues.length}
                onChange={(event) => {
                  if (event.target.checked) {
                    setSelectedProducts(filteredValues);
                  } else {
                    setSelectedProducts([]);
                  }
                }}
              />
            );
          },
          enableSorting: false,
        }),
        ...baseColumns,
        columnHelper.accessor((row) => row.stock_quantity * row.sell_value, {
          id: 'total',
          header: () => 'Total',
          cell: (info) => {
            return info.getValue().toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            });
          },
          footer: (info) => info.column.id,
          sortingFn: (rowA, rowB, columnId) => {
            const numA = rowA.renderValue(columnId) as number;
            const numB = rowB.getValue(columnId) as number;

            return numA < numB ? 1 : numA > numB ? -1 : 0;
          },
        }),
      ];
    }

    return [
      ...baseColumns,
      columnHelper.accessor('id', {
        header: () => 'Ações',
        cell: (info) => (
          <div className="w-full h-full flex justify-start items-center gap-[1rem]">
            <ConfirmToast
              confirmFn={async () => await mutateAsync(info.getValue())}
            >
              <CrossCircledIcon className="w-4 h-4 text-red-500 cursor-pointer" />
            </ConfirmToast>
            <Pencil2Icon
              onClick={() => navigate(info.getValue())}
              className="w-4 h-4 text-primary-dark cursor-pointer"
            />
            <MinusIcon
              onClick={() =>
                navigate(
                  `/movement/create?id=${info.getValue()}&type=${
                    MovementType.OUTFLOW
                  }`,
                )
              }
              className="w-4 h-4 text-red-500 cursor-pointer"
            />
            <PlusIcon
              onClick={() =>
                navigate(
                  `/movement/create?id=${info.getValue()}&type=${
                    MovementType.INFLOW
                  }`,
                )
              }
              className="w-4 h-4 text-primary-dark cursor-pointer"
            />
          </div>
        ),
        footer: (info) => info.column.id,
        enableSorting: false,
      }),
    ];
  }

  const baseColumns = [
    columnHelper.accessor('description', {
      cell: (info) => info.getValue(),
      footer: (info) => info.column.id,
      header: () => 'Descrição',
    }),
    columnHelper.accessor('sell_value', {
      id: 'sellValue',
      cell: (info) => (
        <i>
          {info.getValue().toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </i>
      ),
      header: () => 'Valor de venda',
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor('stock_quantity', {
      header: () => 'Qtd. Estoque',
      cell: (info) => info.renderValue(),
      footer: (info) => info.column.id,
    }),
  ];

  return {
    getColumns,
    selectedProducts,
    isPending,
  };
}
