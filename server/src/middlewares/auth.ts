import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

// Middleware to make sure only admin is allowed
export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new ErrorHandler("Please login first", 401));

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("Invalid user ID", 401));
  if (user.role !== "admin")
    return next(new ErrorHandler("Admin access required", 403));

  next();
});


export const sellerOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new ErrorHandler("Please login first", 401));

  const user = await User.findById(id);
  
  if (!user) return next(new ErrorHandler("Invalid User ID", 401));
  
  if (user.role !== "seller") 
    return next(new ErrorHandler("Only sellers can access this resource", 403));

  next();
});
