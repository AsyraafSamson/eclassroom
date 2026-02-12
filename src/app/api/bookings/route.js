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
    const bookingDate = searchParams.get("date");
    const groupId = searchParams.get("groupId");

    if (!bookingDate) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const db = await getDB();
    let results;

    if (groupId) {
      ({ results } = await db
        .prepare(
          "SELECT b.id, b.classroom_id, b.time_slot_id, b.booking_date, b.status, c.name AS classroom_name, u.full_name AS user_name FROM bookings b JOIN classrooms c ON c.id = b.classroom_id LEFT JOIN users u ON u.id = b.user_id WHERE b.booking_date = ? AND c.group_id = ?"
        )
        .bind(bookingDate, groupId)
        .all());
    } else {
      ({ results } = await db
        .prepare(
          "SELECT b.id, b.classroom_id, b.time_slot_id, b.booking_date, b.status, c.name AS classroom_name, u.full_name AS user_name FROM bookings b JOIN classrooms c ON c.id = b.classroom_id LEFT JOIN users u ON u.id = b.user_id WHERE b.booking_date = ?"
        )
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

    const { classroomId, bookingDate, timeSlotId, purpose } =
      await request.json();

    if (!classroomId || !bookingDate || !timeSlotId) {
      return NextResponse.json(
        { error: "Classroom, date, and time slot are required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const classroom = await db
      .prepare("SELECT id FROM classrooms WHERE id = ?")
      .bind(classroomId)
      .first();

    if (!classroom) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 }
      );
    }

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

    const result = await db
      .prepare(
        "INSERT INTO bookings (user_id, classroom_id, booking_date, time_slot_id, purpose, status) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(
        user.id,
        classroomId,
        bookingDate,
        timeSlotId,
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
