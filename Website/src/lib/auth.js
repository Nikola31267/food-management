import jwt from "jsonwebtoken";

export function verifyToken(req) {
  // Try Authorization first
  const authHeader = req.headers.get("authorization");
  let token;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    // fallback to x-auth-token
    token = req.headers.get("x-auth-token");
  }

  if (!token) {
    throw new Error("Unauthorized");
  }

  return jwt.verify(token, process.env.JWT_SECRET);
}
