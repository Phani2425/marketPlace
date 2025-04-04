import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUser,
  newUser,
  adminLogin,
  sellerLogin
} from "../controllers/user.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// route - /api/v1/user/new
app.post("/new", newUser);

// Route - /api/v1/user/all
app.get("/all", adminOnly, getAllUsers);

// Route - /api/v1/user/dynamicID
app.route("/:id").get(getUser).delete(adminOnly, deleteUser);

app.post("/admin-login", adminLogin);

//remove this in production
app.post("/seller-login", sellerLogin);

export default app;
