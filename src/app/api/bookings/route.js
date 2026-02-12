import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

const BOOKING_LIMIT_PER_SESSION = 20;

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingDate = searchParams.get("date");
    const groupId = searchParams.get("groupId");

    if (!bookingDate) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const baseQuery = `
      SELECT b.id, b.classroom_id, b.time_slot_id, b.booking_date,
             b.session_id, b.teacher_name, b.purpose, b.status,
             c.name AS classroom_name,
             u.full_name AS user_name
      FROM bookings b
      JOIN classrooms c ON c.id = b.classroom_id
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.booking_date = ?`;

    let results;
    if (groupId) {
      ({ results } = await db
        .prepare(baseQuery + " AND c.group_id = ?")
        .bind(bookingDate, groupId)
        .all());
    } else {
      ({ results } = await db
        .prepare(baseQuery)
        .bind(bookingDate)
        .all());
    }

    return NextResponse.json({ bookings: results });
  } catch (error) {
    console.error("GET bookings error:", error);
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

    const { classroomId, bookingDate, timeSlotId, sessionId, teacherName, purpose } =
      await request.json();

    if (!classroomId || !bookingDate || !timeSlotId) {
      return NextResponse.json(
        { error: "Classroom, date, and time slot are required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    // Check classroom exists and is bookable
    const classroom = await db
      .prepare("SELECT id, can_be_booked FROM classrooms WHERE id = ?")
      .bind(classroomId)
      .first();

    if (!classroom) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 }
      );
    }

    if (!classroom.can_be_booked) {
      return NextResponse.json(
        { error: "This classroom is not available for booking" },
        { status: 403 }
      );
    }

    // Check time slot exists
    const slot = await db
      .prepare("SELECT id FROM time_slots WHERE id = ?")
      .bind(timeSlotId)
      .first();

    if (!slot) {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    // Check slot not already booked
    const existing = await db
      .prepare(
        "SELECT id FROM bookings WHERE classroom_id = ? AND booking_date = ? AND time_slot_id = ?"
      )
      .bind(classroomId, bookingDate, timeSlotId)
      .first();

    if (existing) {
      return NextResponse.json(
        { error: "This slot is already booked" },
        { status: 409 }
      );
    }

    // Resolve session_id from date if not provided
    let resolvedSessionId = sessionId || null;
    if (!resolvedSessionId) {
      const session = await db
        .prepare(
          "SELECT id FROM sessions WHERE start_date <= ? AND end_date >= ? LIMIT 1"
        )
        .bind(bookingDate, bookingDate)
        .first();
      if (session) resolvedSessionId = session.id;
    }

    // Enforce booking limit per session (matches EzyBook's 20/session limit)
    if (resolvedSessionId) {
      const countRow = await db
        .prepare(
          "SELECT COUNT(*) AS cnt FROM bookings WHERE user_id = ? AND session_id = ?"
        )
        .bind(user.id, resolvedSessionId)
        .first();

      if (countRow && countRow.cnt >= BOOKING_LIMIT_PER_SESSION) {
        return NextResponse.json(
          { error: `You have reached the booking limit of ${BOOKING_LIMIT_PER_SESSION} per session` },
          { status: 429 }
        );
      }
    }

    const result = await db
      .prepare(
        "INSERT INTO bookings (user_id, classroom_id, booking_date, time_slot_id, session_id, teacher_name, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        user.id,
        classroomId,
        bookingDate,
        timeSlotId,
        resolvedSessionId,
        teacherName || null,
        purpose || null,
        "pending"
      )
      .run();

    const booking = await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("POST booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
