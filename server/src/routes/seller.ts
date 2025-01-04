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
  getSellerAnalytics,
  getSingleProduct,
  rateStore
} from "../controllers/seller.js";
import { mutliUpload,upload } from "../middlewares/multer.js";

const router = express.Router();

// Seller Store & Profile
router.get("/search", searchSellers);
router.get("/store/:id", getSellerStore);
router.post("/register", upload, becomeSeller);
router.get("/profile", sellerOnly, getSellerProfile);
router.put("/profile/update", sellerOnly, mutliUpload, updateSellerProfile);


// Seller Products
router.post("/product/new", sellerOnly, mutliUpload, addProduct);
router.route("/product/:id")
  .get(sellerOnly, getSingleProduct) // Add the GET route for fetching a single product
  .put(sellerOnly, mutliUpload, updateProduct)
  .delete(sellerOnly, deleteProduct);
router.get("/products", sellerOnly, getSellerProducts);

// Seller Analytics
router.get("/stats/:id", sellerOnly, getSellerStats);
router.get("/orders", sellerOnly, getSellerOrders);

router.get("/analytics/:id", sellerOnly, getSellerAnalytics);
router.post("/rate/:id", rateStore);

export default router;