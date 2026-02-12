import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId");

    const db = await getDB();
    let results;

    if (classroomId) {
      ({ results } = await db
        .prepare(
          "SELECT e.*, c.name AS classroom_name FROM equipment e LEFT JOIN classrooms c ON c.id = e.classroom_id WHERE e.classroom_id = ? ORDER BY e.name ASC"
        )
        .bind(classroomId)
        .all());
    } else {
      ({ results } = await db
        .prepare(
          "SELECT e.*, c.name AS classroom_name FROM equipment e LEFT JOIN classrooms c ON c.id = e.classroom_id ORDER BY e.name ASC"
        )
        .all());
    }

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

    const { name, description, classroomId } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Equipment name is required" },
        { status: 400 }
      );
    }

    const db = await getDB();
    const result = await db
      .prepare(
        "INSERT INTO equipment (name, description, classroom_id) VALUES (?, ?, ?)"
      )
      .bind(name.trim(), description || null, classroomId || null)
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
