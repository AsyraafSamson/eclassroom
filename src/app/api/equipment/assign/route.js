import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

// GET: return the full matrix of classroom-equipment assignments
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = await getDB();

    const [classroomsResult, equipmentResult, assignmentsResult] = await Promise.all([
      db.prepare("SELECT id, name, group_id FROM classrooms ORDER BY name ASC").all(),
      db.prepare("SELECT id, name, type, options FROM equipment ORDER BY name ASC").all(),
      db.prepare("SELECT classroom_id, equipment_id, value FROM classroom_equipment").all(),
    ]);

    return NextResponse.json({
      classrooms: classroomsResult.results,
      equipment: equipmentResult.results,
      assignments: assignmentsResult.results,
    });
  } catch (error) {
    console.error("GET equipment assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: bulk save assignments
// Body: { assignments: [{ classroom_id, equipment_id, value }] }
export async function PUT(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { assignments } = await request.json();

    if (!Array.isArray(assignments)) {
      return NextResponse.json({ error: "Assignments must be an array" }, { status: 400 });
    }

    const db = await getDB();

    // Clear all existing assignments
    await db.prepare("DELETE FROM classroom_equipment").run();

    // Insert all non-empty assignments
    for (const a of assignments) {
      if (a.value !== null && a.value !== undefined && a.value !== "") {
        await db
          .prepare("INSERT INTO classroom_equipment (classroom_id, equipment_id, value) VALUES (?, ?, ?)")
          .bind(a.classroom_id, a.equipment_id, String(a.value))
          .run();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT equipment assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
