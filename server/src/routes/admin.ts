import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { 
  getPendingSellers,
  updateSellerStatus
} from "../controllers/admin.js";

const router = express.Router();

// Seller Application Management Routes
router.get("/seller-applications", adminOnly, getPendingSellers);
router.put("/seller-status", adminOnly, updateSellerStatus);

export default router;