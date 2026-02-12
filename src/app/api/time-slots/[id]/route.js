import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

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
    const { label, startTime, endTime } = await request.json();

    if (!label || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Label, start time, and end time are required" },
        { status: 400 }
      );
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const existing = await db
      .prepare("SELECT id FROM time_slots WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    const duplicate = await db
      .prepare(
        "SELECT id FROM time_slots WHERE label = ? AND start_time = ? AND end_time = ? AND id != ?"
      )
      .bind(label, startTime, endTime, id)
      .first();

    if (duplicate) {
      return NextResponse.json(
        { error: "A time slot with the same label and times already exists" },
        { status: 409 }
      );
    }

    await db
      .prepare(
        "UPDATE time_slots SET label = ?, start_time = ?, end_time = ? WHERE id = ?"
      )
      .bind(label, startTime, endTime, id)
      .run();

    const timeSlot = await db
      .prepare("SELECT * FROM time_slots WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({ timeSlot });
  } catch (error) {
    console.error("PUT time slot error:", error);
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
    const db = await getDB();

    const existing = await db
      .prepare("SELECT id FROM time_slots WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    await db.prepare("DELETE FROM time_slots WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE time slot error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
