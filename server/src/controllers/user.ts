import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";

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
