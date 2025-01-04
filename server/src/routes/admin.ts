import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { 
  getPendingSellers,
  updateSellerStatus,
  getAllSellers,
  getSellerDetail
} from "../controllers/admin.js";

const router = express.Router();

// Seller Management Routes
router.get("/sellers", adminOnly, getAllSellers);
router.get("/seller/:id", adminOnly, getSellerDetail);

// Seller Application Management Routes
router.get("/seller-applications", adminOnly, getPendingSellers);
router.put("/seller-status", adminOnly, updateSellerStatus);

export default router;