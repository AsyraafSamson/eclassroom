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
    const { sessionId, weekNumber, startDate, endDate, label } =
      await request.json();

    if (!sessionId || !weekNumber || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Session, week number, start date, and end date are required" },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const existing = await db
      .prepare("SELECT id FROM timetable_weeks WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Timetable week not found" },
        { status: 404 }
      );
    }

    await db
      .prepare(
        "UPDATE timetable_weeks SET session_id = ?, week_number = ?, start_date = ?, end_date = ?, label = ? WHERE id = ?"
      )
      .bind(sessionId, weekNumber, startDate, endDate, label || null, id)
      .run();

    const week = await db
      .prepare("SELECT * FROM timetable_weeks WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({ timetableWeek: week });
  } catch (error) {
    console.error("PUT timetable week error:", error);
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
      .prepare("SELECT id FROM timetable_weeks WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Timetable week not found" },
        { status: 404 }
      );
    }

    await db
      .prepare("DELETE FROM timetable_weeks WHERE id = ?")
      .bind(id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE timetable week error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
