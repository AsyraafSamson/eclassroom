import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "eclassroom-secret"
);

export async function createToken(user) {
  return new SignJWT({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    name: user.full_name,
    mustChangePassword: user.must_change_password === 1 || user.last_login === null || user.last_login === undefined,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
