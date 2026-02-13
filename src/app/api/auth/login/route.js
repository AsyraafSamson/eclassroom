import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    // Support login with username OR email (matches EzyBook behaviour)
    const user = await db
      .prepare(
        "SELECT * FROM users WHERE email = ? OR username = ?"
      )
      .bind(email, email)
      .first();

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last_login timestamp
    await db
      .prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?")
      .bind(user.id)
      .run();

    const token = await createToken(user);

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const message =
      error?.message?.includes("D1") || error?.message?.includes("DB")
        ? "Database not available. Please check D1 binding."
        : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
