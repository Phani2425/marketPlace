import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartReducerInitialState } from "../../types/reducer-types";
import { CartItem, ShippingInfo } from "../../types/types";

// Helper function to get localStorage data or return null
const getLocalStorageData = <T>(key: string): T | null => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const initialState: CartReducerInitialState = {
  loading: false,
  cartItems: getLocalStorageData<CartItem[]>("cartItems") || [],
  subtotal: 0,
  tax: 0,
  shippingCharges: 0,
  discount: 0,
  total: 0,
  coupon: localStorage.getItem("coupon") || undefined,
  shippingInfo: getLocalStorageData<ShippingInfo>("shippingInfo") || {
    address: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
  },
};

export const cartReducer = createSlice({
  name: "cartReducer",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      state.loading = true;

      const index = state.cartItems.findIndex(
        (i) => i.productId === action.payload.productId
      );

      if (index !== -1) state.cartItems[index] = action.payload;
      else state.cartItems.push(action.payload);

      state.loading = false;
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    },

    removeCartItem: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.cartItems = state.cartItems.filter(
        (i) => i.productId !== action.payload
      );
      state.loading = false;
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    },

    calculatePrice: (state) => {
      const subtotal = state.cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      state.subtotal = subtotal;
      state.shippingCharges = state.subtotal > 1000 ? 0 : 200;
      state.tax = Math.round(state.subtotal * 0.18);
      state.total =
        state.subtotal + state.tax + state.shippingCharges - state.discount;
    },

    discountApplied: (state, action: PayloadAction<number>) => {
      state.discount = action.payload;
    },

    saveCoupon: (state, action: PayloadAction<string>) => {
      state.coupon = action.payload;
      localStorage.setItem("coupon", state.coupon);
    },

    saveShippingInfo: (state, action: PayloadAction<ShippingInfo>) => {
      state.shippingInfo = action.payload;
      localStorage.setItem("shippingInfo", JSON.stringify(state.shippingInfo));
    },

    resetCart: () => {
      localStorage.removeItem("cartItems");
      localStorage.removeItem("shippingInfo");
      localStorage.removeItem("coupon");
      return initialState;
    },
  },
});

export const {
  addToCart,
  removeCartItem,
  calculatePrice,
  discountApplied,
  saveShippingInfo,
  resetCart,
  saveCoupon,
} = cartReducer.actions;
