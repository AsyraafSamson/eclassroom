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
      .prepare(
        `SELECT b.id, b.classroom_id, b.time_slot_id, b.booking_date,
                b.teacher_name, b.purpose, b.status, b.created_at,
                c.name AS classroom_name, c.location AS classroom_location,
                ts.label AS slot_label, ts.start_time, ts.end_time
         FROM bookings b
         JOIN classrooms c ON c.id = b.classroom_id
         JOIN time_slots ts ON ts.id = b.time_slot_id
         WHERE b.user_id = ?
         ORDER BY b.booking_date DESC, ts.start_time ASC`
      )
      .bind(user.id)
      .all();

    return NextResponse.json({ bookings: results });
  } catch (error) {
    console.error("GET my bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
