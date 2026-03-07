import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtPayload } from "../types";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.get("authorization");
  const token = authHeader ? authHeader.split(" ")[1] : undefined;

  if (!token) {
    res.status(401).json({ message: "Access token required" });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // Attach user to the request object
    (req as AuthRequest).user = decoded;
    next();
  } catch {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
};