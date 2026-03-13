import express, { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { AuthRequest } from "../types";

const router: Router = express.Router();

const generateToken = (user: { id: string; email: string; role: string }): string => {
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
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("firstName").trim().isLength({ min: 2 }).withMessage("First name must be at least 2 characters"),
    body("lastName").trim().isLength({ min: 2 }).withMessage("Last name must be at least 2 characters")
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
        return;
      }

      const { email, password, firstName, lastName } = req.body;

      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        res.status(400).json({ 
          success: false,
          message: "User already exists" 
        });
        return;
      }

      const salt = await bcrypt.genSalt(12);
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
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            createdAt: user.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        success: false,
        message: "Server error during registration" 
      });
    }
  }
);

/* ================= LOGIN ================= */

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").exists().withMessage("Password is required")
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
        return;
      }

      const { email, password } = req.body;

      const result = await pool.query(
        "SELECT id, email, password, first_name, last_name, role FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ 
          success: false,
          message: "Invalid credentials" 
        });
        return;
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        res.status(401).json({ 
          success: false,
          message: "Invalid credentials" 
        });
        return;
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
          },
          token
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        success: false,
        message: "Server error during login" 
      });
    }
  }
);

/* ================= GET CURRENT USER ================= */

router.get("/me", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const result = await pool.query(
      "SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1",
      [authReq.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
      return;
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching user" 
    });
  }
});

/* ================= LOGOUT ================= */

router.post("/logout", authenticateToken, (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

export default router;