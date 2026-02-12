import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = await getDB();
    const { results } = await db
      .prepare("SELECT id, name, created_at FROM departments ORDER BY name ASC")
      .all();

    return NextResponse.json({ departments: results });
  } catch (error) {
    console.error("GET departments error:", error);
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

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const existing = await db
      .prepare("SELECT id FROM departments WHERE name = ?")
      .bind(name.trim())
      .first();

    if (existing) {
      return NextResponse.json(
        { error: "Department name already exists" },
        { status: 409 }
      );
    }

    const result = await db
      .prepare("INSERT INTO departments (name) VALUES (?)")
      .bind(name.trim())
      .run();

    const department = await db
      .prepare("SELECT * FROM departments WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    console.error("POST department error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
