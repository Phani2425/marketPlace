// server/src/controllers/admin.ts

import { TryCatch } from "../middlewares/error.js";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { invalidateCache, sendEmail } from "../utils/features.js";
import { redis } from "../app.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { getLastMonths } from "../utils/features.js";
import mongoose from "mongoose";

export const getPendingSellers = TryCatch(async (req, res, next) => {
  const key = "pending-sellers";
  let applications;

  // Try to get from cache first
  applications = await redis.get(key);

  if (applications) {
    applications = JSON.parse(applications);
  } else {
    applications = await User.find({
      role: "seller",
      storeStatus: "pending",
    })
      .select("name email storeName storeDescription storeCreatedAt storeImage")
      .lean();

    // Transform dates before caching
    const transformedApplications = applications.map((app) => ({
      ...app,
      createdAt: app.storeCreatedAt || app.createdAt || new Date(),
    }));

    // Cache for 5 minutes
    await redis.setex(key, 300, JSON.stringify(transformedApplications));

    applications = transformedApplications;
  }

  return res.status(200).json({
    success: true,
    applications,
  });
});

export const updateSellerStatus = TryCatch(async (req, res, next) => {
  const { sellerId, status } = req.body;

  if (!sellerId || !status) {
    return next(new ErrorHandler("Please provide seller ID and status", 400));
  }

  const seller = await User.findById(sellerId);
  if (!seller) return next(new ErrorHandler("Seller not found", 404));

  seller.storeStatus = status;

  // If rejected, revert role back to user
  if (status === "rejected") {
    seller.role = "user";
    seller.storeName = undefined;
    seller.storeDescription = undefined;
  }

  // If deregistering, remove all products
  if (status === "deregistered") {
    await Product.deleteMany({ seller: sellerId });
    seller.role = "user";
    seller.storeName = undefined;
    seller.storeDescription = undefined;
    seller.storeImage = undefined;
    seller.storeBanner = undefined;
    seller.sellerRating = undefined;
    seller.storeStatus = "deregistered";
  } else {
    seller.storeStatus = status;
    //remove this in production
    seller.sellerPin= '123456';
  }

  await seller.save();

  await Promise.all([
    redis.del("admin-sellers-list"),
    redis.del(`admin-seller-detail-${sellerId}`),
    redis.del("admin-stats"),
  ]);

  // Send email notification
  const emailSubject = `Store Application ${
    status.charAt(0).toUpperCase() + status.slice(1)
  }`;
  const emailText =
    status === "approved"
      ? "Congratulations! Your store application has been approved. You can now start selling on our platform."
      : `We regret to inform you that your store application has been ${
          status.charAt(0).toUpperCase() + status.slice(1)
        }. Please contact support for more information.`;

  try {
    await sendEmail({
      email: seller.email,
      subject: emailSubject,
      text: emailText,
    });
  } catch (error) {
    console.log("Error sending email:", error);
  }

  // Invalidate all relevant caches
  await Promise.all([
    redis.del("pending-sellers"),
    redis.del(`user-${sellerId}`),
    redis.del("admin-stats"),
    redis.del("all-users"),
  ]);

  return res.status(200).json({
    success: true,
    message: `Seller ${status} successfully`,
  });
});

// admin.ts

// Optimized getAllSellers function
export const getAllSellers = TryCatch(async (req, res, next) => {
  const key = "admin-sellers-list";
  let sellers;

  // Try to get from cache first
  const cachedSellers = await redis.get(key);
  if (cachedSellers) {
    sellers = JSON.parse(cachedSellers);
    return res.status(200).json({ success: true, sellers });
  }

  // Optimized database query using aggregation pipeline
  sellers = await User.aggregate([
    {
      $match: {
        role: "seller",
        storeStatus: "approved",
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "seller",
        as: "products",
      },
    },
    {
      $lookup: {
        from: "orders",
        let: { sellerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$$sellerId", "$orderItems.seller"],
              },
            },
          },
        ],
        as: "orders",
      },
    },
    {
      $addFields: {
        totalProducts: { $size: "$products" },
        totalOrders: { $size: "$orders" },
        totalRevenue: {
          $reduce: {
            input: "$orders",
            initialValue: 0,
            in: { $add: ["$$value", "$$this.total"] },
          },
        },
      },
    },
    {
      $project: {
        id: "$_id",
        name: 1,
        storeName: 1,
        storeImage: 1,
        rating: "$sellerRating",
        totalProducts: 1,
        totalRevenue: 1,
        totalOrders: 1,
        status: "$storeStatus",
        joinedDate: "$storeCreatedAt",
        _id: 0,
      },
    },
  ]).exec();

  // Cache results
  await redis.setex(key, 300, JSON.stringify(sellers));

  return res.status(200).json({ success: true, sellers });
});

export const getSellerDetail = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const key = `admin-seller-detail-${id}`;

  
  const cachedDetail = await redis.get(key);
  if (cachedDetail) {
    return res.status(200).json({
      success: true,
      seller: JSON.parse(cachedDetail),
    });
  }


  const [sellerDetail] = await User.aggregate([
    {
      $match: { _id: id },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "seller",
        as: "products",
      },
    },
    {
      $lookup: {
        from: "orders",
        let: { sellerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$$sellerId", "$orderItems.seller"],
              },
            },
          },
        ],
        as: "allOrders",
      },
    },
    {
      $addFields: {
        totalProducts: { $size: "$products" },
        totalOrders: { $size: "$allOrders" },
        totalRevenue: {
          $sum: "$allOrders.total",
        },

        // Calculate top products based on sales and revenue
        topProducts: {
          $map: {
            input: {
              $slice: [
                {
                  $sortArray: {
                    input: {
                      $map: {
                        input: "$products",
                        as: "product",
                        in: {
                          name: "$$product.name",
                          photo: { $arrayElemAt: ["$$product.photos.url", 0] },
                          sales: {
                            $size: {
                              $filter: {
                                input: "$allOrders",
                                as: "order",
                                cond: {
                                  $in: [
                                    "$$product._id",
                                    "$$order.orderItems.productId",
                                  ],
                                },
                              },
                            },
                          },
                          revenue: {
                            $sum: {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$allOrders",
                                    as: "order",
                                    cond: {
                                      $in: [
                                        "$$product._id",
                                        "$$order.orderItems.productId",
                                      ],
                                    },
                                  },
                                },
                                as: "order",
                                in: "$$order.total",
                              },
                            },
                          },
                        },
                      },
                    },
                    sortBy: { revenue: -1 },
                  },
                },
                5,
              ],
            },
            as: "product",
            in: "$$product",
          },
        }
,
        // Calculate category distribution
        categoryDistribution: {
          $arrayToObject: {
            $map: {
              input: {
                $setUnion: "$products.category",
              },
              as: "category",
              in: {
                k: "$$category",
                v: {
                  $size: {
                    $filter: {
                      input: "$products",
                      as: "product",
                      cond: { $eq: ["$$product.category", "$$category"] },
                    },
                  },
                },
              },
            },
          },
        },

        // Performance metrics
        performanceMetrics: {
          conversionRate: {
            $multiply: [
              {
                $divide: [
                  { $size: "$allOrders" },
                  { $max: [{ $size: "$products" }, 1] },
                ],
              },
              100,
            ],
          },
          averageOrderValue: {
            $divide: [
              { $sum: "$allOrders.total" },
              { $max: [{ $size: "$allOrders" }, 1] },
            ],
          },
          returnRate: 0,
        },

        // Get recent orders
        recentOrders: {
          $slice: [
            {
              $map: {
                input: "$allOrders",
                as: "order",
                in: {
                  _id: "$$order._id",
                  status: "$$order.status",
                  total: "$$order.total",
                  createdAt: "$$order.createdAt",
                },
              },
            },
            -10,
          ],
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        storeName: 1,
        storeDescription: 1,
        storeImage: 1,
        storeBanner: 1,
        sellerRating: 1,
        totalProducts: 1,
        totalOrders: 1,
        totalRevenue: 1,
        storeCreatedAt: 1,
        status: "$storeStatus",
        categoryDistribution: 1,
        performanceMetrics: 1,

        topProducts: 1,
        products: {
          $map: {
            input: "$products",
            as: "product",
            in: {
              _id: "$$product._id",
              name: "$$product.name",
              price: "$$product.price",
              stock: "$$product.stock",
              category: "$$product.category",
              status: "$$product.status",
              photo: { $arrayElemAt: ["$$product.photos.url", 0] },
            },
          },
        },
        recentOrders: {
          $slice: [
            {
              $map: {
                input: "$allOrders",
                as: "order",
                in: {
                  _id: "$$order._id",
                  status: "$$order.status",
                  total: "$$order.total",
                  createdAt: "$$order.createdAt",
                },
              },
            },
            -10,
          ],
        },
      },
    },
  ]).exec();

  if (!sellerDetail) {
    return next(new ErrorHandler("Seller not found", 404));
  }

  const orders = await Order.find({ "orderItems.seller": id })
    .select("total orderItems status createdAt")
    .lean();

  // Calculate monthly revenue and sales using the same logic
  const monthlyRevenue = new Array(6).fill(0);
  const monthlySales = new Array(6).fill(0);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  orders.forEach(order => {
    if (order.createdAt >= sixMonthsAgo) {
      const monthIndex = 5 - Math.floor(
        (new Date().getTime() - order.createdAt.getTime()) / 
        (30 * 24 * 60 * 60 * 1000)
      );
      if (monthIndex >= 0) {
        monthlyRevenue[monthIndex] += order.total;
        monthlySales[monthIndex]++;
      }
    }
  });

  sellerDetail.monthlyRevenue = monthlyRevenue;
  sellerDetail.monthlySales = monthlySales;

  // Cache results for 5 minutes
  await redis.setex(key, 300, JSON.stringify(sellerDetail));

  return res.status(200).json({
    success: true,
    seller: sellerDetail,
  });
});
