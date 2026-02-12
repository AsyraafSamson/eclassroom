import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import crypto from "crypto";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const user = await db
      .prepare("SELECT id, email FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (!user) {
      // Return success even if user not found (security best practice)
      return NextResponse.json({
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await db
      .prepare(
        "UPDATE users SET reset_token = ?, token_expiry = ? WHERE id = ?"
      )
      .bind(resetToken, tokenExpiry, user.id)
      .run();

    // In production, send email with reset link
    // For now, return token in response (ONLY FOR DEVELOPMENT)
    return NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
      resetToken, // Remove this in production
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
