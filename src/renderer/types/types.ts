export interface User {
  name: string;
  id: string;
  password: string;
}

export interface Product {
  id: string;
  user_id: string;
  description: string;
  sell_value: number;
  stock_quantity: number;
  created_at: Date;
}

export enum MovementType {
  INFLOW = 'ENTRADA',
  OUTFLOW = 'SAÍDA',
}

export interface Movement {
  id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  type: MovementType;
  date: string;
  product?: Product;
}

export interface Stablishment {
  id: string;
  user_id: string;
  name: string;
  productsTotal?: number;
}
