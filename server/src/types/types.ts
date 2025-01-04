import { NextFunction, Request, Response } from "express";
import { Document } from 'mongoose';


export interface PopulatedUser {
  _id: string;
  name: string;
  photo: string;
}


export type SearchRequestQuery = {
  search?: string;
  sort?: string;
  category?: string;
  price?: string;
  page?: string;
  order?: string;
};

export type SearchRequest = Request<{}, {}, {}, SearchRequestQuery>;


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


export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  productId: string;
}

export interface Orders extends Document {
  _id: string;
  total: number;
  orderItems: OrderItem[];
  status: "Processing" | "Shipped" | "Delivered";
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
}

export interface RecentOrder {
  _id: string;
  total: number;
  orderItems: OrderItem[];
  status: "Processing" | "Shipped" | "Delivered";
  createdAt: Date;
}

export interface SellerStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyRevenue: number[];
  monthlySales: number[];
  productCategories: Record<string, number>;
  recentOrders: RecentOrder[];
}
export interface SellerDashboardStats {
  stats: SellerStats;
  charts: {
    salesByCategory: { [key: string]: number };
    monthlyRevenue: number[];
    orderStatus: { [key: string]: number };
  };
}

export interface SellerAnalytics {
  totalProducts: number;
  stockStatus: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  monthlyRevenue: number[];
  monthlySales: number[];
  categoryDistribution: Record<string, number>;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
    photo?: string;
  }>;
  performanceMetrics: {
    conversionRate: string;
    averageOrderValue: string|number;
    returnRate: number;
  };
}


