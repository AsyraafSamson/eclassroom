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

    let whereClause = "WHERE u.id != ?";
    const bindings = [user.id];

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
      .prepare(`SELECT u.id FROM users u ${whereClause}`)
      .bind(...bindings)
      .all();

    return NextResponse.json({ ids: results.map((r) => r.id) });
  } catch (error) {
    console.error("GET all user IDs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
