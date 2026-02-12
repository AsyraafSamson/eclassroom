import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

const PAGE_SIZE = 10;

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const db = await getDB();

    let whereClause = "WHERE 1=1";
    const bindings = [];

    if (search) {
      whereClause += " AND (u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)";
      const pattern = `%${search}%`;
      bindings.push(pattern, pattern, pattern);
    }

    if (role && (role === "admin" || role === "user")) {
      whereClause += " AND u.role = ?";
      bindings.push(role);
    }

    // Count total
    const countRow = await db
      .prepare(
        `SELECT COUNT(*) AS total FROM users u ${whereClause}`
      )
      .bind(...bindings)
      .first();

    const total = countRow?.total || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const offset = (page - 1) * PAGE_SIZE;

    // Fetch page
    const { results } = await db
      .prepare(
        `SELECT u.id, u.username, u.email, u.full_name, u.role, u.department_id,
                d.name AS department_name, u.last_login, u.created_at
         FROM users u
         LEFT JOIN departments d ON d.id = u.department_id
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...bindings, PAGE_SIZE, offset)
      .all();

    return NextResponse.json({
      users: results,
      pagination: { page, pageSize: PAGE_SIZE, total, totalPages },
    });
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { username, email, password, fullName, role, departmentId } =
      await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
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

    // Check duplicate email
    const emailExists = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (emailExists) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Check duplicate username
    if (username) {
      const usernameExists = await db
        .prepare("SELECT id FROM users WHERE username = ?")
        .bind(username)
        .first();

      if (usernameExists) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db
      .prepare(
        "INSERT INTO users (username, email, password_hash, full_name, role, department_id) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(
        username || null,
        email,
        passwordHash,
        fullName || "",
        normalizedRole,
        departmentId || null
      )
      .run();

    const newUser = await db
      .prepare(
        `SELECT u.id, u.username, u.email, u.full_name, u.role, u.department_id,
                d.name AS department_name, u.created_at
         FROM users u
         LEFT JOIN departments d ON d.id = u.department_id
         WHERE u.id = ?`
      )
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("POST user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
