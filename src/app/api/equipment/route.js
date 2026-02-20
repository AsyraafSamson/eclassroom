import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = await getDB();
    const { results } = await db
      .prepare("SELECT * FROM equipment ORDER BY name ASC")
      .all();

    return NextResponse.json({ equipment: results });
  } catch (error) {
    console.error("GET equipment error:", error);
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

    const { name, type, options } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Equipment name is required" },
        { status: 400 }
      );
    }

    const equipmentType = type || "CHECKBOX";
    if (!["CHECKBOX", "TEXT", "SELECT"].includes(equipmentType)) {
      return NextResponse.json(
        { error: "Invalid equipment type" },
        { status: 400 }
      );
    }

    const db = await getDB();
    const result = await db
      .prepare(
        "INSERT INTO equipment (name, type, options) VALUES (?, ?, ?)"
      )
      .bind(name.trim(), equipmentType, options || null)
      .run();

    const equipment = await db
      .prepare("SELECT * FROM equipment WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ equipment }, { status: 201 });
  } catch (error) {
    console.error("POST equipment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
