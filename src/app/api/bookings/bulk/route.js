import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

const BOOKING_LIMIT_PER_SESSION = 20;

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { classroomId, bookingDate, timeSlotIds, sessionId, purpose, userId } =
      await request.json();

    // Admin can book on behalf of another user
    let bookingUserId = user.id;
    let bookingUsername = user.username;
    if (userId && user.role === "admin") {
      const db2 = await getDB();
      const targetUser = await db2
        .prepare("SELECT id, username FROM users WHERE id = ?")
        .bind(userId)
        .first();
      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      bookingUserId = targetUser.id;
      bookingUsername = targetUser.username;
    }

    if (!classroomId || !bookingDate || !timeSlotIds || timeSlotIds.length === 0) {
      return NextResponse.json(
        { error: "Classroom, date, and time slots are required" },
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

    // Check session booking limit
    if (resolvedSessionId) {
      const countRow = await db
        .prepare(
          "SELECT COUNT(*) AS cnt FROM bookings WHERE user_id = ? AND session_id = ?"
        )
        .bind(bookingUserId, resolvedSessionId)
        .first();

      const currentCount = countRow?.cnt || 0;
      const newTotal = currentCount + timeSlotIds.length;

      if (newTotal > BOOKING_LIMIT_PER_SESSION) {
        return NextResponse.json(
          {
            error: `You can only make ${BOOKING_LIMIT_PER_SESSION} bookings per session. You have ${currentCount} and are trying to add ${timeSlotIds.length} more.`,
          },
          { status: 429 }
        );
      }
    }

    // Check if the date falls on a holiday (scoped to session)
    const holiday = await db
      .prepare(
        "SELECT id, holiday_name FROM holidays WHERE is_enabled = 1 AND (session_id = ? OR session_id IS NULL) AND date <= ? AND (end_date IS NULL AND date = ? OR end_date IS NOT NULL AND end_date >= ?)"
      )
      .bind(resolvedSessionId, bookingDate, bookingDate, bookingDate)
      .first();

    if (holiday) {
      return NextResponse.json(
        { error: `Cannot book on this date — it is a holiday: ${holiday.holiday_name}` },
        { status: 400 }
      );
    }

    // Check if any slots are already booked
    const existingBookings = await db
      .prepare(
        `SELECT time_slot_id FROM bookings
         WHERE classroom_id = ? AND booking_date = ? AND time_slot_id IN (${timeSlotIds.map(() => "?").join(",")})`
      )
      .bind(classroomId, bookingDate, ...timeSlotIds)
      .all();

    if (existingBookings.results.length > 0) {
      const bookedSlotIds = existingBookings.results.map((b) => b.time_slot_id);
      return NextResponse.json(
        {
          error: `Some time slots are already booked: ${bookedSlotIds.join(", ")}`,
        },
        { status: 409 }
      );
    }

    // Create all bookings
    const bookings = [];
    for (const timeSlotId of timeSlotIds) {
      const result = await db
        .prepare(
          "INSERT INTO bookings (user_id, classroom_id, booking_date, time_slot_id, session_id, teacher_name, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          bookingUserId,
          classroomId,
          bookingDate,
          timeSlotId,
          resolvedSessionId,
          bookingUsername,
          purpose || null,
          "approved"
        )
        .run();

      const booking = await db
        .prepare("SELECT * FROM bookings WHERE id = ?")
        .bind(result.meta.last_row_id)
        .first();

      bookings.push(booking);
    }

    return NextResponse.json({ bookings }, { status: 201 });
  } catch (error) {
    console.error("POST bulk bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
