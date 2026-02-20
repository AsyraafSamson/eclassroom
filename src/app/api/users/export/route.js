import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

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

    const db = await getDB();

    let whereClause = "WHERE 1=1";
    const bindings = [];

    if (search) {
      whereClause +=
        " AND (u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)";
      const pattern = `%${search}%`;
      bindings.push(pattern, pattern, pattern);
    }

    if (role && (role === "admin" || role === "user")) {
      whereClause += " AND u.role = ?";
      bindings.push(role);
    }

    const { results } = await db
      .prepare(
        `SELECT u.username, u.email, u.full_name, u.role,
                d.name AS department, u.last_login, u.created_at
         FROM users u
         LEFT JOIN departments d ON d.id = u.department_id
         ${whereClause}
         ORDER BY u.created_at DESC`
      )
      .bind(...bindings)
      .all();

    // Build CSV
    const headers = [
      "username",
      "email",
      "full_name",
      "role",
      "department",
      "last_login",
      "created_at",
    ];

    function escapeCsv(value) {
      const str = value == null ? "" : String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const lines = [headers.join(",")];
    for (const row of results) {
      lines.push(headers.map((h) => escapeCsv(row[h])).join(","));
    }

    const csv = lines.join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="users_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
