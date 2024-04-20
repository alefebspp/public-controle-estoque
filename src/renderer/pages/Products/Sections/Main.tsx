import Spinner from '../../../components/Loaders/Spinner';
import ProductsTable from '../../../components/Tables/ProductsTable';

import useAuthContext from '../../../hooks/useAuth';
import { useGetProducts } from '../../../hooks/useProducts';

export const ProductsMain = () => {
  const { user, stablishment } = useAuthContext();

  const { data, isLoading } = useGetProducts({
    userId: user?.id || '',
    stablishmentId: stablishment?.id || '',
  });

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
        {`Lista de produtos ${stablishment ? `| ${stablishment.name}` : ''}`}
      </h2>
      <ProductsTable products={data?.products || []} />
    </div>
  );
};
