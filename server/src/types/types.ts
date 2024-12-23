import { NextFunction, Request, Response } from "express";

export interface NewUserRequestBody {
  name: string;
  email: string;
  photo: string;
  gender: string;
  _id: string;
  dob: Date;
}

export interface NewProductRequestBody {
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
}

export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export type SearchRequestQuery = {
  search?: string;
  price?: string;
  category?: string;
  sort?: string;
  page?: string;
};

export interface BaseQuery {
  name?: {
    $regex: string;
    $options: string;
  };
  price?: { $lte: number };
  category?: string;
}

export type InvalidateCacheProps = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  review?: boolean;
  userId?: string;
  orderId?: string;
  productId?: string | string[];
};

export type OrderItemType = {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: string;
};

export type ShippingInfoType = {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: number;
};

export interface NewOrderRequestBody {
  shippingInfo: ShippingInfoType;
  user: string;
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  orderItems: OrderItemType[];
}

// Existing types...

export type UserRole = "admin" | "user" | "seller";

export interface StoreInfo {
  storeName: string;
  storeDescription: string;
  storeImage: string;
  storeStatus: "pending" | "approved" | "rejected";
  storeCreatedAt: Date;
}

export interface User {
  name: string;
  email: string;
  photo: string;
  gender: string;
  role: UserRole;
  dob: string;
  _id: string;
  // Add seller specific fields
  storeInfo?: StoreInfo;
}

// Add seller specific types
export interface SellerStats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  recentOrders: Order[];
  topProducts: Product[];
  monthlySales: {
    month: string;
    sales: number;
  }[];
}

export interface SellerDashboardStats {
  stats: SellerStats;
  charts: {
    salesByCategory: { [key: string]: number };
    monthlyRevenue: number[];
    orderStatus: { [key: string]: number };
  };
}
