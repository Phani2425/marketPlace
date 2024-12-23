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
} from "../utils/features.js";

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

  if (!id) return next(new ErrorHandler("Store ID is required", 400));

  try {
    // Find seller regardless of product status but must be approved seller
    const seller = await User.findOne({
      _id: id,
      role: "seller",
      storeStatus: "approved"
    }).select("storeName storeDescription storeImage sellerRating joinedDate totalProducts");

    if (!seller) return next(new ErrorHandler("Store not found", 404));

    // Get seller's approved products
    const products = await Product.find({ 
      seller: seller._id,
      status: "approved" 
    }).sort({ createdAt: -1 }); // Latest products first

    return res.status(200).json({
      success: true,
      seller: {
        ...seller.toObject(),
        totalProducts: products.length
      },
      products
    });

  } catch (error) {
    return next(new ErrorHandler("Invalid store identifier", 400));
  }
});

// Get Seller Products
export const getSellerProducts = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  const key = `seller-products-${id}`;
  let products = await redis.get(key);

  if (products) {
    products = JSON.parse(products);
  } else {
    products = await Product.find({ seller: id });
    await redis.set(key, JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

// Get Seller Stats
export const getSellerStats = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const key = `seller-stats-${id}`;
  let stats = await redis.get(key);

  if (stats) {
    stats = JSON.parse(stats);
  } else {
    const [products, orders] = await Promise.all([
      Product.find({ seller: id }),
      Order.find({ "orderItems.seller": id }).select(
        "total orderItems status createdAt"
      ),
    ]);

    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (total, order) => total + order.total,
      0
    );

    const monthlyRevenue = Array(12).fill(0);
    const monthlySales = Array(12).fill(0);

    orders.forEach((order) => {
      const monthIndex = new Date(order.createdAt).getMonth();
      monthlySales[monthIndex]++;
      monthlyRevenue[monthIndex] += order.total;
    });

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
      recentOrders: orders.slice(-5),
      topProducts: products.sort((a, b) => b.ratings - a.ratings).slice(0, 5),
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

  await invalidateCache({
    product: true,
    seller: true,
    sellerId: seller._id,
  });

  return res.status(201).json({
    success: true,
    message: "Product created successfully and pending approval",
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
  product.status = "pending"; // Require re-approval after update

  await product.save();
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

export const deleteProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const seller = await User.findById(req.query.id);

  if (!seller) return next(new ErrorHandler("Seller not found", 404));

  const product = await Product.findById(id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (product.seller.toString() !== seller._id.toString())
    return next(new ErrorHandler("Not authorized to delete this product", 403));

  await deleteFromCloudinary(product.photos.map((p) => p.public_id));
  await product.deleteOne();

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
  const sellerId= req.params.id;
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
  } else {
    // Fetch all necessary data
    const [products, orders] = await Promise.all([
      Product.find({ seller: sellerId }),
      Order.find({ "orderItems.seller": sellerId })
        .select("orderItems total createdAt status")
        .populate("orderItems.product", "price")
    ]);

    // Calculate analytics
    const totalProducts = products.length;
    
    // Stock status
    const stockStatus = {
      inStock: products.filter(p => p.stock > 10).length,
      lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
      outOfStock: products.filter(p => p.stock === 0).length
    };

    // Monthly data
    const monthlyRevenue = new Array(6).fill(0);
    const monthlySales = new Array(6).fill(0);

    // Category distribution
    const categoryDistribution = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Process orders
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    orders.forEach(order => {
      if (order.createdAt >= sixMonthsAgo) {
        const monthIndex = 5 - Math.floor((new Date().getTime() - order.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000));
        if (monthIndex >= 0) {
          monthlyRevenue[monthIndex] += order.total;
          monthlySales[monthIndex]++;
        }
      }
    });

    // Top performing products
    const productSales = new Map();
    const productRevenue = new Map();

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.seller.toString() === id) {
          productSales.set(item.name, (productSales.get(item.name) || 0) + item.quantity);
          productRevenue.set(item.name, (productRevenue.get(item.name) || 0) + (item.price * item.quantity));
        }
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([name, sales]) => ({
        name,
        sales,
        revenue: productRevenue.get(name)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Performance metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    const performanceMetrics = {
      conversionRate: ((totalOrders / (products.length || 1)) * 100).toFixed(2),
      averageOrderValue: totalOrders ? (totalRevenue / totalOrders).toFixed(2) : 0,
      returnRate: 0 // You can implement actual return rate calculation if you have that data
    };

    analytics = {
      totalProducts,
      stockStatus,
      monthlyRevenue,
      monthlySales,
      categoryDistribution,
      topProducts,
      performanceMetrics
    };

    // Cache the analytics
    await redis.setex(key, 3600, JSON.stringify(analytics));
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