import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = express.Router();

const generateToken = (user: { id: string; email: string; role: string }) => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"]
  };

  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    options
  );
};

/* ================= REGISTER ================= */

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("firstName").trim().isLength({ min: 2 }),
    body("lastName").trim().isLength({ min: 2 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName } = req.body;

      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const result = await pool.query(
        `INSERT INTO users (email, password, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, first_name, last_name, role, created_at`,
        [email, hashedPassword, firstName, lastName, "user"]
      );

      const user = result.rows[0];

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at
        },
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* ================= LOGIN ================= */

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").exists()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const result = await pool.query(
        "SELECT id, email, password, first_name, last_name, role FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* ================= GET CURRENT USER ================= */

router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const result = await pool.query(
      "SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1",
      [authReq.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOGOUT ================= */

router.post("/logout", authenticateToken, (req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

export default router;