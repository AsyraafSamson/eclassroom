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

    const booking = await db
      .prepare(
        `SELECT b.*, c.name AS classroom_name, u.full_name AS user_name,
                ts.label AS slot_label, ts.start_time, ts.end_time
         FROM bookings b
         JOIN classrooms c ON c.id = b.classroom_id
         LEFT JOIN users u ON u.id = b.user_id
         LEFT JOIN time_slots ts ON ts.id = b.time_slot_id
         WHERE b.id = ?`
      )
      .bind(id)
      .first();

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("GET booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, purpose } = body;

    const db = await getDB();

    const existing = await db
      .prepare(
        `SELECT b.id, b.user_id, b.status, b.booking_date, ts.end_time
         FROM bookings b
         LEFT JOIN time_slots ts ON ts.id = b.time_slot_id
         WHERE b.id = ?`
      )
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Only admin or booking owner can edit
    if (user.role !== "admin" && existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if the booking time has already passed
    const now = new Date();
    const slotEnd = new Date(`${existing.booking_date}T${existing.end_time}`);
    if (slotEnd < now) {
      return NextResponse.json(
        { error: "Cannot modify a booking that has already passed" },
        { status: 400 }
      );
    }

    // Build dynamic update
    const updates = [];
    const values = [];

    if (status) {
      if (!["pending", "approved", "rejected"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updates.push("status = ?");
      values.push(status);
    }

    if (purpose !== undefined) {
      updates.push("purpose = ?");
      values.push(purpose);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    await db
      .prepare(`UPDATE bookings SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    const booking = await db
      .prepare(
        `SELECT b.*, c.name AS classroom_name, u.full_name AS user_name,
                ts.label AS slot_label, ts.start_time, ts.end_time
         FROM bookings b
         JOIN classrooms c ON c.id = b.classroom_id
         LEFT JOIN users u ON u.id = b.user_id
         LEFT JOIN time_slots ts ON ts.id = b.time_slot_id
         WHERE b.id = ?`
      )
      .bind(id)
      .first();

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("PATCH booking error:", error);
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

    const { id } = await params;
    const db = await getDB();

    const existing = await db
      .prepare(
        `SELECT b.id, b.user_id, b.booking_date, ts.end_time
         FROM bookings b
         LEFT JOIN time_slots ts ON ts.id = b.time_slot_id
         WHERE b.id = ?`
      )
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Only admin or booking owner can delete
    if (user.role !== "admin" && existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if the booking time has already passed
    const now = new Date();
    const slotEnd = new Date(`${existing.booking_date}T${existing.end_time}`);
    if (slotEnd < now) {
      return NextResponse.json(
        { error: "Cannot delete a booking that has already passed" },
        { status: 400 }
      );
    }

    await db.prepare("DELETE FROM bookings WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
