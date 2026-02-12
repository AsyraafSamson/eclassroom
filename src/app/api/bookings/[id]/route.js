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
    const { status } = await request.json();

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const existing = await db
      .prepare("SELECT id, user_id, status FROM bookings WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Only admin can approve/reject, user can only cancel their own
    if (user.role !== "admin" && existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db
      .prepare(
        "UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .bind(status, id)
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
      .prepare("SELECT id, user_id FROM bookings WHERE id = ?")
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
