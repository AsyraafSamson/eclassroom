import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDB();

    const { results } = await db
      .prepare(
        `SELECT e.id, e.name, e.type, e.options, ce.value
         FROM equipment e
         LEFT JOIN classroom_equipment ce ON ce.equipment_id = e.id AND ce.classroom_id = ?
         ORDER BY e.name ASC`
      )
      .bind(id)
      .all();

    return NextResponse.json({ equipment: results });
  } catch (error) {
    console.error("GET classroom equipment error:", error);
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
    const { equipment } = await request.json();

    if (!Array.isArray(equipment)) {
      return NextResponse.json(
        { error: "Equipment must be an array" },
        { status: 400 }
      );
    }

    const db = await getDB();

    // Delete existing assignments for this classroom
    await db
      .prepare("DELETE FROM classroom_equipment WHERE classroom_id = ?")
      .bind(id)
      .run();

    // Insert new assignments (only items with a value)
    for (const item of equipment) {
      if (item.value !== null && item.value !== undefined && item.value !== "") {
        await db
          .prepare(
            "INSERT INTO classroom_equipment (classroom_id, equipment_id, value) VALUES (?, ?, ?)"
          )
          .bind(id, item.equipment_id, String(item.value))
          .run();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT classroom equipment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
