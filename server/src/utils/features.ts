import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { Redis } from "ioredis";
import mongoose, { Document } from "mongoose";
import { redis } from "../app.js";
import { Product } from "../models/product.js";
import { Review } from "../models/review.js";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import nodemailer from 'nodemailer';
import { User } from "../models/user.js";
import crypto from 'crypto';
import moment from 'moment';
import { createIndexes } from "./createIndexes.js";

interface EmailOptions {
  email: string;
  subject: string;
  text: string;
}

export const sendEmail = async (options: EmailOptions) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: options.email,
    subject: options.subject,
    text: options.text
  });
};

export const findAverageRatings = async (
  productId: mongoose.Types.ObjectId
) => {
  let totalRating = 0;

  const reviews = await Review.find({ product: productId });
  reviews.forEach((review) => {
    totalRating += review.rating;
  });

  const averateRating = Math.floor(totalRating / reviews.length) || 0;

  return {
    numOfReviews: reviews.length,
    ratings: averateRating,
  };
};

const getBase64 = (file: Express.Multer.File) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadToCloudinary = async (files: Express.Multer.File[]) => {
  const promises = files.map(async (file) => {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload(getBase64(file), (error, result) => {
        if (error) return reject(error);
        resolve(result!);
      });
    });
  });

  const result = await Promise.all(promises);

  return result.map((i) => ({
    public_id: i.public_id,
    url: i.secure_url,
  }));
};

export const deleteFromCloudinary = async (publicIds: string[]) => {
  const promises = publicIds.map((id) => {
    return new Promise<void>((resolve, reject) => {
      cloudinary.uploader.destroy(id, (error, result) => {
        if (error) return reject(error);
        resolve();
      });
    });
  });

  await Promise.all(promises);
};

export const connectRedis = (redisURI: string) => {
  const redis = new Redis(redisURI);

  redis.on("connect", () => console.log("Redis Connected"));
  redis.on("error", (e) => console.log(e));

  return redis;
};

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "Ecommerce_24",
    })
    .then((c) =>{ console.log(`DB Connected to ${c.connection.host}`);
      createIndexes();
    })
    .catch((e) => console.log(e));
};


export const invalidateCache = async ({
  product,
  productId,
  seller,
  sellerId,
  admin,
  order,
  orderId,
  userId,
  reviews
}: {
  product?: boolean;
  productId?: string | string[];
  seller?: boolean;
  sellerId?: string;
  admin?: boolean;
  order?: boolean;
  orderId?: string;
  userId?: string;
  reviews?: boolean;
}) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];

    if (typeof productId === "string") {
      productKeys.push(`product-${productId}`);
      // Also invalidate reviews cache for this product
      productKeys.push(`reviews-${productId}`);
    }

    if (typeof productId === "object") {
      productId.forEach((id) => {
        productKeys.push(`product-${id}`);
        productKeys.push(`reviews-${id}`);
      });
    }

    await redis.del(productKeys);
  }

  if (seller) {
    const sellerKeys: string[] = [
      `seller-products-${sellerId}`,
      `seller-stats-${sellerId}`,
      `seller-analytics-${sellerId}`,
    ];

    await redis.del(sellerKeys);
  }

  if (order) {
    const ordersKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    await redis.del(ordersKeys);
  }

  if (admin) {
    await redis.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);
    if (!product) throw new Error("Product Not Found");
    product.stock -= order.quantity;
    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });

  return categoryCount;
};

interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}
type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total";
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property]!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });

  return data;
};

export const clearSellerCache = async (sellerId: string) => {
  const keys = [
    `seller-products-${sellerId}`,
    `seller-stats-${sellerId}`,
    `seller-analytics-${sellerId}`
  ];
  
  await Promise.all(keys.map(key => redis.del(key)));
};


export const initializeAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const adminId = crypto.randomUUID(); // Use randomUUID instead of randomBytes
      await User.create({
        _id: adminId,
        name: process.env.ADMIN_NAME || 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        photo: "default-admin.jpg",
        role: "admin",
        gender: "male",
        dob: new Date(),
      });
      console.log("Admin account initialized");
    }
  } catch (error) {
    console.error("Failed to initialize admin:", error);
  }
};

export const getLastMonths = () => {
  const currentDate = moment();
  currentDate.date(1);

  const last6Months: string[] = [];
  const last12Months: string[] = [];

  for (let i = 0; i < 6; i++) {
    const monthDate = currentDate.clone().subtract(i, "months");
    const monthName = monthDate.format("MMM");
    last6Months.unshift(monthName);
  }

  for (let i = 0; i < 12; i++) {
    const monthDate = currentDate.clone().subtract(i, "months");
    const monthName = monthDate.format("MMM"); 
    last12Months.unshift(monthName);
  }

  return {
    last12Months,
    last6Months,
  };
};