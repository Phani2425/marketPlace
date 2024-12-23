import mongoose from "mongoose";
import validator from "validator";

interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  photo: string;
  role: "admin" | "user" | "seller";
  gender: "male" | "female";
  dob: Date;
  createdAt: Date;
  updatedAt: Date;
  // Seller specific fields
  storeName?: string;
  storeDescription?: string;
  storeImage?: string;
  storeStatus: "pending" | "approved" | "rejected";
  storeCreatedAt?: Date;
}

const schema = new mongoose.Schema(
  {
    _id: {
      type: String, // Changed from default ObjectId to String
      required: true
    },
    name: {
      type: String,
      required: [true, "Please enter Name"],
    },
    email: {
      type: String,
      unique: [true, "Email already Exists"],
      required: [true, "Please enter Email"],
      validate: validator.isEmail,
    },
    photo: {
      type: String,
      required: [true, "Please add Photo"],
    },
    role: {
      type: String,
      enum: ["admin", "user", "seller"],
      default: "user",
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Please enter Gender"],
    },
    dob: {
      type: Date,
      required: [true, "Please enter Date of Birth"],
    },
    // Seller specific fields
    storeName: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function(v: string) {
          return v.length >= 3 && v.length <= 50;
        },
        message: 'Store name must be between 3 and 50 characters'
      }
    },
    storeDescription: {
      type: String,
      maxLength: [500, "Store description cannot exceed 500 characters"]
    },
    storeImage: {
      type: String
    },
    storeStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    storeBanner: {
      type: String
    },
    sellerRating: {
      type: Number,
      default: 0
    },
    totalProducts: {
      type: Number,
      default: 0
    },
    storeCreatedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
  }
);

schema.pre("save", function(next) {
  if (this.isModified("role") && this.role === "seller") {
    this.storeCreatedAt = new Date();
  }
  next();
});


schema.virtual("age").get(function () {
  const today = new Date();
  const dob = this.dob;
  let age = today.getFullYear() - dob.getFullYear();

  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
});

export const User = mongoose.model<IUser>("User", schema);


