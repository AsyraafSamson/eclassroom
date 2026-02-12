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
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 20;

    const db = await getDB();

    let whereClause = "";
    const bindings = [];

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      whereClause = "WHERE b.status = ?";
      bindings.push(status);
    }

    const countRow = await db
      .prepare(`SELECT COUNT(*) AS total FROM bookings b ${whereClause}`)
      .bind(...bindings)
      .first();

    const total = countRow?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    const { results } = await db
      .prepare(
        `SELECT b.id, b.booking_date, b.purpose, b.teacher_name, b.status, b.created_at,
                c.name AS classroom_name,
                ts.label AS slot_label, ts.start_time, ts.end_time,
                u.full_name AS user_name, u.email AS user_email
         FROM bookings b
         JOIN classrooms c ON c.id = b.classroom_id
         JOIN time_slots ts ON ts.id = b.time_slot_id
         LEFT JOIN users u ON u.id = b.user_id
         ${whereClause}
         ORDER BY b.booking_date DESC, ts.start_time ASC
         LIMIT ? OFFSET ?`
      )
      .bind(...bindings, pageSize, offset)
      .all();

    return NextResponse.json({
      bookings: results,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (error) {
    console.error("GET all bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
