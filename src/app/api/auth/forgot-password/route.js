import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

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
      .prepare("SELECT id, email, full_name FROM users WHERE email = ?")
      .bind(email)
      .first();

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Generate plain token (sent in email) and hash it before storing
    const plainToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(plainToken, 10);
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    // Delete existing unused tokens for this user
    await db
      .prepare("DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL")
      .bind(user.id)
      .run();

    // Store hashed token in dedicated table
    await db
      .prepare(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
      )
      .bind(user.id, hashedToken, expiresAt)
      .run();

    // Send reset email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;
    const resetLink = `${baseUrl}/reset-password?token=${plainToken}&email=${encodeURIComponent(user.email)}`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: user.email,
      subject: "Reset Your Password - eClassroom",
      html: `
        <p>Hi ${user.full_name || user.email},</p>
        <p>You requested a password reset for your eClassroom account.</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    return NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
