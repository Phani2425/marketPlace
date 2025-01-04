import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter Name"],
    },
    photos: [
      {
        public_id: {
          type: String,
          required: [true, "Please enter Public ID"],
        },
        url: {
          type: String,
          required: [true, "Please enter URL"],
        },
      },
    ],
    price: {
      type: Number,
      required: [true, "Please enter Price"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter Stock"],
    },
    category: {
      type: String,
      required: [true, "Please enter Category"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Please enter Description"],
    },

    ratings: {
      type: Number,
      default: 0,
    },

    numOfReviews: {
      type: Number,
      default: 0,
    },
        // Add seller related fields
        seller: {
          type: String,
          ref: "User",
          required: [true, "Please specify the seller"],
        },
        sellerName: {
          type: String,
          required: [true, "Seller name is required"]
        },
        sellerRating: {
          type: Number,
          default: 0
        },
        sellerNumOfReviews: {
          type: Number,
          default: 0
        },
        isApproved: {
          type: Boolean,
          default: true
        },
        approvedAt: {
          type: Date
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected","deregistered"],
          default: "approved"
        }
  },
  {
    timestamps: true,
        // Add virtual for seller info
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
  }
);

// Virtual for seller store URL
schema.virtual('storeUrl').get(function() {
  return `/store/${this.seller}`;
});

// Add index for better search performance
schema.index({ seller: 1 }); 
schema.index({ seller: 1, status: 1 });
schema.index({ category: 1, status: 1 });
schema.index({ name: 'text', description: 'text' });
schema.index({ seller: 1 });

export const Product = mongoose.model("Product", schema);
