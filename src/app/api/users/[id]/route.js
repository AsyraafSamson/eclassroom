import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const db = await getDB();

    const targetUser = await db
      .prepare(
        `SELECT u.id, u.username, u.email, u.full_name, u.role, u.department_id,
                d.name AS department_name, u.last_login, u.created_at
         FROM users u
         LEFT JOIN departments d ON d.id = u.department_id
         WHERE u.id = ?`
      )
      .bind(id)
      .first();

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: targetUser });
  } catch (error) {
    console.error("GET user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { username, email, password, fullName, role, departmentId } =
      await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedRole = role || "user";
    if (!["admin", "user"].includes(normalizedRole)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const existing = await db
      .prepare("SELECT id FROM users WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check duplicate email
    const emailDup = await db
      .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
      .bind(email, id)
      .first();

    if (emailDup) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Check duplicate username
    if (username) {
      const usernameDup = await db
        .prepare("SELECT id FROM users WHERE username = ? AND id != ?")
        .bind(username, id)
        .first();

      if (usernameDup) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        );
      }
    }

    // Password is optional on update (only change if provided)
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await db
        .prepare(
          `UPDATE users SET username = ?, email = ?, password_hash = ?, full_name = ?,
           role = ?, department_id = ?, updated_at = datetime('now') WHERE id = ?`
        )
        .bind(
          username || null,
          email,
          passwordHash,
          fullName || "",
          normalizedRole,
          departmentId || null,
          id
        )
        .run();
    } else {
      await db
        .prepare(
          `UPDATE users SET username = ?, email = ?, full_name = ?,
           role = ?, department_id = ?, updated_at = datetime('now') WHERE id = ?`
        )
        .bind(
          username || null,
          email,
          fullName || "",
          normalizedRole,
          departmentId || null,
          id
        )
        .run();
    }

    const updatedUser = await db
      .prepare(
        `SELECT u.id, u.username, u.email, u.full_name, u.role, u.department_id,
                d.name AS department_name, u.last_login, u.created_at
         FROM users u
         LEFT JOIN departments d ON d.id = u.department_id
         WHERE u.id = ?`
      )
      .bind(id)
      .first();

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("PUT user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent self-deletion (matches EzyBook behaviour)
    if (String(user.id) === String(id)) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const existing = await db
      .prepare("SELECT id FROM users WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Cascading: bookings are deleted via ON DELETE CASCADE in schema
    await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
