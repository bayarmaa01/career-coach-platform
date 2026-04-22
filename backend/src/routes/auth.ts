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
      console.log('📝 Registration attempt:', req.body.email);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        res.status(400).json({ 
          success: false,
          message: "Validation failed",
          errors: errors.array() 
        });
        return;
      }

      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      console.log('🔍 Checking if user exists...');
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        console.log('❌ User already exists:', email);
        res.status(400).json({ 
          success: false,
          message: "User already exists" 
        });
        return;
      }

      console.log('🔐 Hashing password...');
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      console.log('💾 Creating new user...');
      const result = await pool.query(
        `INSERT INTO users (email, password, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, first_name, last_name, role, created_at`,
        [email, hashedPassword, firstName, lastName, "user"]
      );

      const user = result.rows[0];
      console.log('✅ User created successfully:', user.email);

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      console.log('🎫 Token generated for user:', user.email);
      
      res.status(201).json({
        success: true,
        message: "User registered successfully",
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
      console.error("❌ Registration error:", error);
      
      // Handle specific database errors
      if (error instanceof Error) {
        if (error.message.includes('connection')) {
          res.status(503).json({ 
            success: false,
            message: "Database connection error. Please try again later." 
          });
          return;
        }
        if (error.message.includes('duplicate key')) {
          res.status(400).json({ 
            success: false,
            message: "User already exists" 
          });
          return;
        }
      }
      
      res.status(500).json({ 
        success: false,
        message: "Server error during registration",
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
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
      console.log('🔑 Login attempt:', req.body.email);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        res.status(400).json({ 
          success: false,
          message: "Validation failed",
          errors: errors.array() 
        });
        return;
      }

      const { email, password } = req.body;

      console.log('🔍 Looking up user...');
      const result = await pool.query(
        "SELECT id, email, password, first_name, last_name, role FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        console.log('❌ User not found:', email);
        res.status(401).json({ 
          success: false,
          message: "Invalid credentials" 
        });
        return;
      }

      const user = result.rows[0];
      console.log('🔐 Comparing password for user:', user.email);
      
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        console.log('❌ Password mismatch for user:', user.email);
        res.status(401).json({ 
          success: false,
          message: "Invalid credentials" 
        });
        return;
      }

      console.log('✅ Login successful for user:', user.email);
      
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      console.log('🎫 Token generated for user:', user.email);

      res.status(200).json({
        success: true,
        message: "Login successful",
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
      console.error("❌ Login error:", error);
      
      // Handle specific database errors
      if (error instanceof Error) {
        if (error.message.includes('connection')) {
          res.status(503).json({ 
            success: false,
            message: "Database connection error. Please try again later." 
          });
          return;
        }
      }
      
      res.status(500).json({ 
        success: false,
        message: "Server error during login",
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
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