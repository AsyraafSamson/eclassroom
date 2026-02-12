import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getDB } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = getDB();
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear must_change_password flag
    const result = await db
      .prepare(
        "UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?"
      )
      .bind(newHash, payload.userId)
      .run();

    if (!result.success) {
      throw new Error("Failed to update password");
    }

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("First-login password change error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
