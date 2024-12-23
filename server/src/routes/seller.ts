import express from "express";
import { adminOnly, sellerOnly } from "../middlewares/auth.js";
import { 
  getSellerStats, 
  getSellerProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getSellerOrders,
  getSellerProfile,
  updateSellerProfile,
  becomeSeller,
  getSellerStore,
  searchSellers,
  getSellerAnalytics
} from "../controllers/seller.js";
import { mutliUpload } from "../middlewares/multer.js";

const router = express.Router();

// Seller Store & Profile
router.post("/register", becomeSeller);
router.get("/profile", sellerOnly, getSellerProfile);
router.put("/profile/update", sellerOnly, mutliUpload, updateSellerProfile);
router.get("/store/:id", getSellerStore);

// Seller Products
router.post("/product/new", sellerOnly, mutliUpload, addProduct);
router.route("/product/:id")
  .put(sellerOnly, mutliUpload, updateProduct)
  .delete(sellerOnly, deleteProduct);
router.get("/products", sellerOnly, getSellerProducts);

// Seller Analytics
router.get("/stats", sellerOnly, getSellerStats);
router.get("/orders", sellerOnly, getSellerOrders);
router.get("/search", searchSellers);
router.get("/analytics/:id", sellerOnly, getSellerAnalytics);

export default router;