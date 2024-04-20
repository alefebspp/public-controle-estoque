import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { createMovementSchema } from '../../../lib/schemas/movement';

import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Spinner from '../../../components/Loaders/Spinner';
import Select from '../../../components/Select/Select';

import useAuthContext from '../../../hooks/useAuth';
import { useGetProducts } from '../../../hooks/useProducts';
import { useCreateMovement } from '../../../hooks/useMovement';
import { MovementType, Product } from '../../../types/types';

import { compareTextsWithNumbers } from '../../../lib/helpers/sorts';
import { ChangeEvent, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { InfoCircledIcon } from '@radix-ui/react-icons';

export const CreateMovement = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const { user, stablishment } = useAuthContext();
  const queryParams = new URLSearchParams(useLocation().search);
  const targetProduct = queryParams.get('id');
  const movementType = queryParams.get('type');

  const { data, isLoading } = useGetProducts({
    userId: user?.id || '',
    stablishmentId: stablishment?.id || '',
  });

  const { mutateAsync } = useCreateMovement();

  const productsOptions =
    data?.products
      .sort((a, b) => compareTextsWithNumbers(a.description, b.description))
      .map((product) => ({
        label: product.description,
        value: product.id,
      })) || [];

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm({
    resolver: yupResolver(createMovementSchema),
    defaultValues: {
      product_id: targetProduct ?? '',
      type: movementType ?? '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (user && stablishment) {
      const response = await mutateAsync({
        ...data,
        user_id: user.id,
        stablishment_id: stablishment.id,
      });

      if (response.success) {
        reset();
      }
    }
  });

  function handleProductOnChange(event: ChangeEvent<HTMLSelectElement>) {
    const foundProduct = data?.products.find((product) => {
      return product.id === event.target.value;
    });
    if (foundProduct) {
      setSelectedProduct(foundProduct);
    }
  }

  useEffect(() => {
    if (targetProduct) {
      const foundProduct = data?.products.find((product) => {
        return product.id === targetProduct;
      });
      if (foundProduct) {
        setSelectedProduct(foundProduct);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-md lg:text-lg xl:text-xl font-semibold text-graphite-400">
        {`Novo Movimento ${stablishment ? `| ${stablishment.name}` : ''}`}
      </h2>
      <div className="w-full h-full flex justify-center items-center">
        <form
          onSubmit={onSubmit}
          className="w-fit flex flex-col justify-center items-center gap-[15px]"
        >
          <Select
            name="product_id"
            label="Produto"
            placeholder="Selecione um produto"
            register={register}
            errors={errors}
            options={productsOptions}
            onChange={handleProductOnChange}
          />
          <Select
            name="type"
            label="Tipo"
            placeholder="Selecione o tipo de movimento"
            register={register}
            errors={errors}
            options={[
              {
                label: 'Entrada',
                value: MovementType.INFLOW,
              },
              {
                label: 'Saída',
                value: MovementType.OUTFLOW,
              },
            ]}
          />
          <Input
            register={register}
            errors={errors}
            name="quantity"
            placeholder="Digite a quantidade"
            type="number"
            label="Quantidade"
          />
          <Input
            register={register}
            errors={errors}
            name="date"
            type="date"
            label="Data do movimento"
          />
          {selectedProduct && (
            <div className="w-full flex items-center justify-start bg-primary-super-light p-2 rounded-md">
              <InfoCircledIcon className="w-7 h-7 text-primary-dark" />
              <p className="text-primary-dark text-xs m-auto">
                Quantidade em estoque:{' '}
                <span className="font-semibold text-xs">
                  {selectedProduct.stock_quantity}
                </span>
              </p>
            </div>
          )}
          <Button
            className="w-full"
            variant="secondary"
            isLoading={isSubmitting}
            type="submit"
          >
            Criar
          </Button>
        </form>
      </div>
    </div>
  );
};
