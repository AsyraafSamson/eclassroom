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
    const { sessionId, holidayName, description, date, endDate, year, isEnabled } =
      await request.json();

    if (!holidayName || !date) {
      return NextResponse.json(
        { error: "Holiday name and date are required" },
        { status: 400 }
      );
    }

    if (endDate && endDate < date) {
      return NextResponse.json(
        { error: "End date cannot be before start date" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const existing = await db
      .prepare("SELECT id FROM holidays WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 }
      );
    }

    const enabled = isEnabled === undefined || isEnabled === null ? 1 : isEnabled ? 1 : 0;

    await db
      .prepare(
        "UPDATE holidays SET session_id = ?, holiday_name = ?, description = ?, date = ?, end_date = ?, year = ?, is_enabled = ? WHERE id = ?"
      )
      .bind(
        sessionId || null,
        holidayName,
        description || null,
        date,
        endDate || null,
        year || null,
        enabled,
        id
      )
      .run();

    const holiday = await db
      .prepare("SELECT * FROM holidays WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({ holiday });
  } catch (error) {
    console.error("PUT holiday error:", error);
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
      .prepare("SELECT id FROM holidays WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 }
      );
    }

    await db.prepare("DELETE FROM holidays WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE holiday error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
