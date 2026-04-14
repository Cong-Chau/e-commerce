import { Router } from "express";
import authRoute from "./auth.route";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Server đang chạy ổn định ✅" });
});

router.use("/auth", authRoute);

export default router;
