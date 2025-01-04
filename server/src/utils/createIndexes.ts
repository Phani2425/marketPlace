// src/utils/createIndexes.ts
import { User } from "../models/user.js";
import { Product } from "../models/product.js";
import { Order } from "../models/order.js";

export const createIndexes = async () => {
  try {
    // Create indexes for User collection
    await User.collection.createIndex({ role: 1, storeStatus: 1 });
    await User.collection.createIndex({ _id: 1, role: 1 });

    // Create index for Product collection
    await Product.collection.createIndex({ seller: 1 });

    // Create indexes for Order collection
    await Order.collection.createIndex({ "orderItems.seller": 1 });
    await Order.collection.createIndex({ createdAt: -1 });

    console.log('All indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};