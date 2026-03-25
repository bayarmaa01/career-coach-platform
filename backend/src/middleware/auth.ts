import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtPayload } from "../types";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Try both lowercase and uppercase authorization headers
  const authHeader = req.get("authorization") || req.get("Authorization");
  
  if (!authHeader) {
    console.log("No authorization header found");
    res.status(401).json({ 
      success: false,
      message: "Access token required" 
    });
    return;
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.split(" ")[1] 
    : authHeader;

  if (!token) {
    console.log("No token found in authorization header");
    res.status(401).json({ 
      success: false,
      message: "Access token required" 
    });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    console.log("Token verified successfully for user:", decoded.id);
    
    // Attach user to request object
    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    console.log("Token verification failed:", error);
    res.status(403).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
      return;
    }

    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({ 
        success: false,
        message: "Insufficient permissions" 
      });
      return;
    }

    next();
  };
};