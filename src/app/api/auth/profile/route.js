import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function PATCH(request) {
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
    const { fullName } = await request.json();

    if (!fullName || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    // Update user's name
    const result = await db
      .prepare("UPDATE users SET name = ? WHERE id = ?")
      .bind(fullName.trim(), payload.userId)
      .run();

    if (!result.success) {
      throw new Error("Failed to update profile");
    }

    // Fetch updated user
    const user = await db
      .prepare("SELECT id, email, name, role FROM users WHERE id = ?")
      .bind(payload.userId)
      .first();

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
