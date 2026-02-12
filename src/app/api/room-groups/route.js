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
      .prepare("SELECT id, name, description FROM room_groups ORDER BY name ASC")
      .all();

    return NextResponse.json({ roomGroups: results });
  } catch (error) {
    console.error("GET room groups error:", error);
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

    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const existing = await db
      .prepare("SELECT id FROM room_groups WHERE name = ?")
      .bind(name.trim())
      .first();

    if (existing) {
      return NextResponse.json(
        { error: "Group name already exists" },
        { status: 409 }
      );
    }

    const result = await db
      .prepare("INSERT INTO room_groups (name, description) VALUES (?, ?)")
      .bind(name.trim(), description || null)
      .run();

    const roomGroup = await db
      .prepare("SELECT * FROM room_groups WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ roomGroup }, { status: 201 });
  } catch (error) {
    console.error("POST room group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
