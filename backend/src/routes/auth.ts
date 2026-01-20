import { Router, type Request, type Response } from "express";

const router = Router();

router.post("/verify", (req: Request, res: Response) => {
  const { password } = req.body || {};
  const configuredPassword = (process.env.PASSWORD || "").trim();

  // If no password configured, bypass protection
  if (!configuredPassword) {
    return res.json({ success: true, bypass: true });
  }

  if (typeof password !== "string" || !password.trim()) {
    return res.status(400).json({
      success: false,
      error: "密码不能为空",
    });
  }

  if (password === configuredPassword) {
    return res.json({ success: true });
  }

  return res.status(401).json({
    success: false,
    error: "密码错误",
  });
});

router.get("/get-password", (_req: Request, res: Response) => {
  res.json({
    hasPassword: Boolean((process.env.PASSWORD || "").trim()),
    password: process.env.PASSWORD ? process.env.PASSWORD : "",
  });
});

export default router;
