import { NextResponse } from "next/server";
import { getUser, createToken } from "@/lib/auth";
import { getDB } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDB();
    const { fullName, email, departmentId, newPassword } =
      await request.json();

    // Validate required fields
    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const emailExists = await db
      .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
      .bind(email.trim(), user.id)
      .first();

    if (emailExists) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update profile, password, last_login, and clear must_change_password
    await db
      .prepare(
        `UPDATE users
         SET full_name = ?,
             email = ?,
             department_id = ?,
             password_hash = ?,
             must_change_password = 0,
             last_login = datetime('now')
         WHERE id = ?`
      )
      .bind(
        fullName.trim(),
        email.trim(),
        departmentId || null,
        newHash,
        user.id
      )
      .run();

    // Fetch updated user to reissue token
    const updatedUser = await db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(user.id)
      .first();

    const token = await createToken(updatedUser);

    const response = NextResponse.json({
      message: "Profile completed successfully",
    });

    // Reissue token so middleware no longer redirects to /first-login
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("First-login profile completion error:", error);
    return NextResponse.json(
      { error: "Failed to complete profile" },
      { status: 500 }
    );
  }
}
