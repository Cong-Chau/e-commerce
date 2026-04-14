import { Router } from "express";
import authRoute from "./auth.route";
import userRoute from "./user.route";
const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Server đang chạy ổn định ✅" });
});

router.use("/auth", authRoute);

router.use("/users", userRoute);

export default router;
