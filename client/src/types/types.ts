export type User = {
  name: string;
  email: string;
  photo: string;
  gender: string;
  role: string;
  dob: string;
  _id: string;
};

export type Product = {
  name: string;
  price: number;
  stock: number;
  category: string;
  ratings: number;
  numOfReviews: number;
  description: string;
  photos: {
    url: string;
    public_id: string;
  }[];
  _id: string;
  oldPrice?: number;
  discount?: number;
};

export type Review = {
  _id: string;
  rating: number;
  comment: string;
  user: {
    _id: string;
    name: string;
    photo: string;
  };
  createdAt: string;
};

export type ShippingInfo = {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
};

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  photo: string;
}


export type OrderItem = Omit<CartItem, "stock"> & { _id: string };

export type Order = {
  orderItems: OrderItem[];
  shippingInfo: ShippingInfo;
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  status: string;
  user: {
    name: string;
    _id: string;
  };
  _id: string;
};

type CountAndChange = {
  revenue: number;
  product: number;
  user: number;
  order: number;
};

type LatestTransaction = {
  _id: string;
  amount: number;
  discount: number;
  quantity: number;
  status: string;
};

export type Stats = {
  categoryCount: Record<string, number>[];
  changePercent: CountAndChange;
  count: CountAndChange;
  chart: {
    order: number[];
    revenue: number[];
  };
  userRatio: {
    male: number;
    female: number;
  };
  latestTransaction: LatestTransaction[];
  totalSellers: number;
  newSellers: number;
  sellerGrowth: number[];
  revenueDistribution: {
    top: number;
    middle: number;
    bottom: number;
  };
};

type OrderFullfillment = {
  processing: number;
  shipped: number;
  delivered: number;
};

type RevenueDistribution = {
  netMargin: number;
  discount: number;
  productionCost: number;
  burnt: number;
  marketingCost: number;
};

type UsersAgeGroup = {
  teen: number;
  adult: number;
  old: number;
};

export type Pie = {
  orderFullfillment: OrderFullfillment;
  productCategories: Record<string, number>[];
  stockAvailablity: {
    inStock: number;
    outOfStock: number;
  };
  revenueDistribution: RevenueDistribution;
  usersAgeGroup: UsersAgeGroup;
  adminCustomer: {
    admin: number;
    customer: number;
  };
};

export type Bar = {
  users: number[];
  products: number[];
  orders: number[];
};
export type Line = {
  users: number[];
  products: number[];
  discount: number[];
  revenue: number[];
};

export type CouponType = {
  code: string;
  amount: number;
  _id: string;
};




export interface Photo {
  public_id: string;
  url: string;
  _id: string;
  id: string;
}

export interface ProductForCard {
  _id: string;
  name: string;
  photos: Photo[];
  price: number;
  stock: number;
  category: string;
  description: string;
  ratings: number;
  numOfReviews: number;
  seller: string;
  sellerName: string;
  sellerRating: number;
  sellerNumOfReviews: number;
  isApproved: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  storeUrl: string;
  id: string;
}