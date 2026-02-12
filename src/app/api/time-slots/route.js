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
      .prepare("SELECT id, label, start_time, end_time FROM time_slots ORDER BY start_time ASC")
      .all();

    return NextResponse.json({ timeSlots: results });
  } catch (error) {
    console.error("GET time slots error:", error);
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

    const duplicate = await db
      .prepare(
        "SELECT id FROM time_slots WHERE label = ? AND start_time = ? AND end_time = ?"
      )
      .bind(label, startTime, endTime)
      .first();

    if (duplicate) {
      return NextResponse.json(
        { error: "A time slot with the same label and times already exists" },
        { status: 409 }
      );
    }

    const result = await db
      .prepare(
        "INSERT INTO time_slots (label, start_time, end_time) VALUES (?, ?, ?)"
      )
      .bind(label, startTime, endTime)
      .run();

    const timeSlot = await db
      .prepare("SELECT * FROM time_slots WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ timeSlot }, { status: 201 });
  } catch (error) {
    console.error("POST time slot error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
