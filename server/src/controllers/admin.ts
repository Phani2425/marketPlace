// server/src/controllers/admin.ts

import { TryCatch } from "../middlewares/error.js";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { invalidateCache, sendEmail } from "../utils/features.js";
import { redis } from "../app.js";

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
      storeStatus: "pending" 
    }).select("name email storeName storeDescription createdAt");

    // Cache for 5 minutes
    await redis.setex(key, 300, JSON.stringify(applications));
  }

  return res.status(200).json({
    success: true,
    applications
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

  await seller.save();

  // Send email notification
  const emailSubject = `Store Application ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  const emailText = status === "approved" 
    ? "Congratulations! Your store application has been approved. You can now start selling on our platform."
    : "We regret to inform you that your store application has been rejected. Please contact support for more information.";

  try {
    await sendEmail({
      email: seller.email,
      subject: emailSubject,
      text: emailText
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
    message: `Seller ${status} successfully`
  });
});