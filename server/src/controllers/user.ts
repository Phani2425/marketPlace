import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";
import { redis } from "../app.js"; 
// export const newUser = TryCatch(
//   async (
//     req: Request<{}, {}, NewUserRequestBody>,
//     res: Response,
//     next: NextFunction
//   ) => {
//     const { name, email, photo, gender, _id, dob } = req.body;

//     let user = await User.findById(_id);

//     if (user)
//       return res.status(200).json({
//         success: true,
//         message: `Welcome, ${user.name}`,
//       });

//     if (!_id || !name || !email || !photo || !gender || !dob)
//       return next(new ErrorHandler("Please add all fields", 400));

//     user = await User.create({
//       name,
//       email,
//       photo,
//       gender,
//       _id,
//       dob: new Date(dob),
//     });

//     return res.status(201).json({
//       success: true,
//       message: `Welcome, ${user.name}`,
//     });
//   }
// );


// server/src/controllers/user.ts

export const newUser = TryCatch(
  async (req: Request<{}, {}, NewUserRequestBody>, res, next) => {
    const { name, email, photo, gender, _id, dob } = req.body;

    if (!_id) {
      return next(new ErrorHandler("Firebase ID is required", 400));
    }

    try {
      let user = await User.findById(_id);

      if (user) {
        // User exists - return existing user data
        return res.status(200).json({
          success: true,
          message: `Welcome back, ${user.name}`,
          user
        });
      }

      // Validate new user data
      if (!name || !email || !photo || !gender || !dob) {
        return next(new ErrorHandler("Please add all fields", 400));
      }

      // Create new user with proper error handling
      user = await User.create({
        _id, // Important: Use Firebase UID as MongoDB _id
        name,
        email,
        photo,
        gender,
        dob: new Date(dob),
        role: "user"
      });

      return res.status(201).json({
        success: true,
        message: "Account created successfully",
        user
      });

    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        return next(new ErrorHandler("Email already exists", 400));
      }
      console.error("User creation error:", error);
      return next(new ErrorHandler("Error creating user", 500));
    }
  }
);

export const getUser = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  try {
    const user = await User.findById(id).select('-__v');

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Get user error:", error);
    return next(new ErrorHandler("Invalid user ID or server error", 400));
  }
});

export const getAllUsers = TryCatch(async (req, res, next) => {
  const users = await User.find({});

  return res.status(200).json({
    success: true,
    users,
  });
});

// export const getUser = TryCatch(async (req, res, next) => {
//   const id = req.params.id;
//   const user = await User.findById(id);

//   if (!user) return next(new ErrorHandler("Invalid Id", 400));

//   return res.status(200).json({
//     success: true,
//     user,
//   });
// });

export const deleteUser = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler("Invalid Id", 400));

  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});


export const adminLogin = TryCatch(async (req, res, next) => {
  const { secretKey } = req.body;

  if (!secretKey) {
    return next(new ErrorHandler("Admin secret key is required", 400));
  }

  if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    return next(new ErrorHandler("Invalid admin credentials", 401));
  }

  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    return next(new ErrorHandler("Admin account not found", 404));
  }

  // Add rate limiting check here
  const rateLimitKey = `admin-login-attempts:${req.ip}`;
  const attempts = await redis.incr(rateLimitKey);
  if (attempts === 1) {
    await redis.expire(rateLimitKey, 300); // 5 minutes
  }
  if (attempts > 5) {
    return next(new ErrorHandler("Too many login attempts. Try again later.", 429));
  }

  // Clear rate limit on successful login
  if (secretKey === process.env.ADMIN_SECRET_KEY) {
    await redis.del(rateLimitKey);
  }

  return res.status(200).json({
    success: true,
    message: "Admin login successful",
    user: admin
  });
});


//temporary

export const sellerLogin = TryCatch(async (req, res, next) => {
  const { email, pin } = req.body;

  if (!email || !pin) {
    return next(new ErrorHandler("Please provide both email and PIN", 400));
  }

  // Find seller with given email and PIN
  const seller = await User.findOne({ 
    email, 
    sellerPin: pin,
    role: "seller",
    storeStatus: "approved"
  }).select("+sellerPin");

  if (!seller) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  // Rate limiting
  const rateLimitKey = `seller-login-attempts:${req.ip}`;
  const attempts = await redis.incr(rateLimitKey);
  if (attempts === 1) {
    await redis.expire(rateLimitKey, 300); // 5 minutes
  }

  if (attempts > 5) {
    return next(new ErrorHandler("Too many login attempts. Try again later.", 429));
  }

  // Clear rate limit on successful login
  await redis.del(rateLimitKey);

  // Remove sensitive data
  seller.sellerPin = undefined;

  return res.status(200).json({
    success: true,
    message: "Login successful",
    user: seller
  });
});