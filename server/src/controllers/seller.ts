import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { Order } from "../models/order.js";
import ErrorHandler from "../utils/utility-class.js";
import { redis } from "../app.js";
import {
  invalidateCache,
  uploadToCloudinary,
  deleteFromCloudinary,
  clearSellerCache
} from "../utils/features.js";
import mongoose from "mongoose";

// Register as Seller
export const becomeSeller = TryCatch(async (req, res, next) => {
  const { storeName, storeDescription } = req.body;
  const userId = req.query.id;

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (user.role === "seller")
    return next(new ErrorHandler("Already a seller", 400));

  const existingStore = await User.findOne({ storeName });
  if (existingStore)
    return next(new ErrorHandler("Store name already exists", 400));

  user.role = "seller";
  user.storeName = storeName;
  user.storeDescription = storeDescription;
  user.storeStatus = "pending";

  await user.save();
  await invalidateCache({ admin: true });

  return res.status(200).json({
    success: true,
    message: "Store registration request submitted successfully",
  });
});

// Get Seller Profile
export const getSellerProfile = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  const seller = await User.findById(id).select(
    "name email storeName storeDescription storeImage storeStatus"
  );
  if (!seller) return next(new ErrorHandler("Seller not found", 404));

  return res.status(200).json({
    success: true,
    seller,
  });
});

// Update Seller Profile
export const updateSellerProfile = TryCatch(async (req, res, next) => {
  const { id } = req.query;
  const { storeName, storeDescription } = req.body;
  const storeImage = req.file;

  const seller = await User.findById(id);
  if (!seller) return next(new ErrorHandler("Seller not found", 404));

  if (storeName) {
    const existingStore = await User.findOne({
      storeName,
      _id: { $ne: id },
    });
    if (existingStore)
      return next(new ErrorHandler("Store name already exists", 400));

    seller.storeName = storeName;
  }

  if (storeDescription) seller.storeDescription = storeDescription;

  if (storeImage) {
    const result = await uploadToCloudinary(storeImage);
    seller.storeImage = result.url;
  }

  await seller.save();
  await invalidateCache({ admin: true });

  return res.status(200).json({
    success: true,
    message: "Store profile updated successfully",
  });
});

export const getSellerStore = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ErrorHandler("Store ID is required", 400));
  }

  // Find the seller with store information
  const seller = await User.findOne({
    _id: id,
    role: "seller",
    storeStatus: "approved"
  }).select("name email storeName storeDescription storeImage storeBanner sellerRating totalProducts createdAt");

  if (!seller) {
    return next(new ErrorHandler("Store not found or not approved", 404));
  }

  // Get seller's products
  const products = await Product.find({
    seller: id,
    status: "approved"
  }).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    store: {
      ...seller.toObject(),
      products,
      totalProducts: products.length
    }
  });
});

// Get Seller Products
export const getSellerProducts = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new ErrorHandler("Seller ID is required", 400));

  const key = `seller-products-${id}`;
  let products;

  try {
    // Try to get from cache
    products = await redis.get(key);
    
    if (products) {
      products = JSON.parse(products);
    } else {
      // Fetch all products belonging to seller
      products = await Product.find({ 
        seller: id 
      }).sort({ createdAt: -1 });

      // Cache the results
      await redis.setex(key, 300, JSON.stringify(products));
    }

    console.log(`Found ${products.length} products for seller ${id}`);

    return res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return next(new ErrorHandler("Error fetching products", 500));
  }
});

// Get Seller Stats
export const getSellerStats = TryCatch(async (req, res, next) => {
  const sellerId = req.params.id;
  const userId = req.query.id;

  if (!userId) return next(new ErrorHandler("Please login first", 401));

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("Invalid user ID", 401));
  if (user.role !== "seller") 
    return next(new ErrorHandler("Only sellers can access this resource", 403));

  const key = `seller-stats-${sellerId}`;
  let stats = await redis.get(key);

  if (stats) {
    stats = JSON.parse(stats);
  } else {
    const [products, orders] = await Promise.all([
      Product.find({ seller: sellerId }),
      Order.find({ "orderItems.seller": sellerId })
        .select("total orderItems status createdAt")
    ]);

    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    const monthlyRevenue = new Array(6).fill(0);
    const monthlySales = new Array(6).fill(0);

    const productCategories = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    stats = {
      totalProducts,
      totalOrders,
      totalRevenue,
      monthlyRevenue,
      monthlySales,
      productCategories,
      recentOrders: orders.slice(-5)
    };

    await redis.setex(key, 1800, JSON.stringify(stats));
  }

  return res.status(200).json({
    success: true,
    stats,
  });
});

export const addProduct = TryCatch(async (req: Request, res, next) => {
  const { name, price, stock, category, description } = req.body;
  const photos = req.files as Express.Multer.File[] | undefined;
  const seller = await User.findById(req.query.id);

  if (!seller) return next(new ErrorHandler("Seller not found", 404));
  if (seller.role !== "seller")
    return next(new ErrorHandler("Not authorized as seller", 403));
  if (!photos) return next(new ErrorHandler("Please add photos", 400));
  if (photos.length < 1)
    return next(new ErrorHandler("Please add at least one photo", 400));
  if (photos.length > 5)
    return next(new ErrorHandler("Maximum 5 photos allowed", 400));
  if (!name || !price || !stock || !category || !description)
    return next(new ErrorHandler("Please enter all fields", 400));

  const photosURL = await uploadToCloudinary(photos);

  await Product.create({
    name,
    price,
    stock,
    category: category.toLowerCase(),
    description,
    photos: photosURL,
    seller: seller._id,
    sellerName: seller.name,
  });

  await clearSellerCache(seller._id);

  await invalidateCache({
    product: true,
    seller: true,
    sellerId: seller._id,
    
      admin: true
  });

  

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
  });
});

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category, description } = req.body;
  const photos = req.files as Express.Multer.File[] | undefined;
  const seller = await User.findById(req.query.id);

  if (!seller) return next(new ErrorHandler("Seller not found", 404));

  const product = await Product.findById(id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (product.seller.toString() !== seller._id.toString())
    return next(new ErrorHandler("Not authorized to update this product", 403));

  if (photos) {
    if (photos.length > 5)
      return next(new ErrorHandler("Maximum 5 photos allowed", 400));

    const photosURL = await uploadToCloudinary(photos);
    await deleteFromCloudinary(product.photos.map((p) => p.public_id));
    product.photos = photosURL;
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category.toLowerCase();
  if (description) product.description = description;
  product.status = "approved"; // Require re-approval after update

  await product.save();
  await clearSellerCache(seller._id);

  await invalidateCache({
    product: true,
    seller: true,
    sellerId: seller._id,
    productId: id,
  });

  return res.status(200).json({
    success: true,
    message: "Product updated successfully and pending approval",
  });
});

export const deleteProduct = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const seller = await User.findById(req.query.id);

  if (!seller) return next(new ErrorHandler("Seller not found", 404));

  const product = await Product.findById(id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (product.seller.toString() !== seller._id.toString())
    return next(new ErrorHandler("Not authorized to delete this product", 403));

  await deleteFromCloudinary(product.photos.map((p) => p.public_id));
  await product.deleteOne();

  await clearSellerCache(seller._id);

  await invalidateCache({
    product: true,
    seller: true,
    sellerId: seller._id,
    productId: id,
  });

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Get Seller Orders
export const getSellerOrders = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  const key = `seller-orders-${id}`;
  let orders = await redis.get(key);

  if (orders) {
    orders = JSON.parse(orders);
  } else {
    orders = await Order.find({ "orderItems.seller": id }).populate(
      "user",
      "name email"
    );
    await redis.set(key, JSON.stringify(orders));
  }

  return res.status(200).json({
    success: true,
    orders,
  });
});

export const getSellerAnalytics = TryCatch(async (req, res, next) => {
  const sellerId = req.params.id;
  const userId = req.query.id;

  if (!userId) return next(new ErrorHandler("Please login first", 401));

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("Invalid user ID", 401));
  if (user.role !== "seller") 
    return next(new ErrorHandler("Only sellers can access this resource", 403));

  const key = `seller-analytics-${sellerId}`;
  let analytics = await redis.get(key);

  if (analytics) {
    analytics = JSON.parse(analytics);
    console.log(`Fetched analytics from cache for seller ${sellerId}`);
  } else {
    // Fetch ALL products regardless of status
    const [products, orders] = await Promise.all([
      Product.find({ seller: sellerId }),
      Order.find({ "orderItems.seller": sellerId })
        .select("orderItems total createdAt status")
        .populate("orderItems.product", "price")
    ]);

    // Calculate analytics with all products
    const totalProducts = products.length;

    const stockStatus = {
      inStock: products.filter(p => p.stock > 10).length,
      lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
      outOfStock: products.filter(p => p.stock === 0).length
    };

    const categoryDistribution = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    analytics = {
      totalProducts,
      stockStatus,
      monthlyRevenue,
      monthlySales,
      categoryDistribution,
      topProducts: products
        .map(p => ({
          name: p.name,
          sales: orders.filter(o => 
            o.orderItems.some(item => 
              item.product.toString() === p._id.toString()
            )
          ).length,
          revenue: orders.reduce((sum, o) => {
            const orderItem = o.orderItems.find(
              item => item.product.toString() === p._id.toString()
            );
            return sum + (orderItem ? orderItem.price * orderItem.quantity : 0);
          }, 0),
          photo: p.photos[0]?.url // Include the photo URL
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
      performanceMetrics: {
        conversionRate: ((totalOrders / (totalProducts || 1)) * 100).toFixed(2),
        averageOrderValue: totalOrders ? (totalRevenue / totalOrders).toFixed(2) : 0,
        returnRate: 0
      }
    };

    // Cache analytics for 1 hour
    await redis.setex(key, 3600, JSON.stringify(analytics));
    console.log(`Fetched analytics from DB for seller ${sellerId}`);
  }

  return res.status(200).json({
    success: true,
    analytics
  });
});


export const searchSellers = TryCatch(async (req, res, next) => {
    const { query } = req.query;
    
    if (!query) return next(new ErrorHandler("Search query is required", 400));
  
    const key = `seller-search-${query}`;
    let sellers = await redis.get(key);
  
    if (sellers) {
      sellers = JSON.parse(sellers);
    } else {
      sellers = await User.find({
        role: "seller",
        storeStatus: "approved",
        $or: [
          { storeName: { $regex: query, $options: "i" } },
          { storeDescription: { $regex: query, $options: "i" } }
        ]
      }).select("_id storeName storeImage").limit(10);
  
      await redis.setex(key, 600, JSON.stringify(sellers));
    }
  
    return res.status(200).json({
      success: true,
      sellers,
    });
  });

  export const getSingleProduct = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const key = `product-${id}`;
  
    let product;
  
    try {
      // Try to get from cache
      product = await redis.get(key);
      
      if (product) {
        product = JSON.parse(product);
        console.log(`Fetched product from cache for ID ${id}`);
      } else {
        // Fetch product from database
        product = await Product.findById(id);
        if (!product) return next(new ErrorHandler("Product not found", 404));
  
        // Cache the result
        await redis.setex(key, 300, JSON.stringify(product));
        console.log(`Fetched product from DB for ID ${id}`);
      }
  
      return res.status(200).json({
        success: true,
        product
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      return next(new ErrorHandler("Error fetching product", 500));
    }
  });