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
    const sessionId = searchParams.get("sessionId");

    const db = await getDB();
    let results;

    if (sessionId) {
      ({ results } = await db
        .prepare(
          "SELECT h.*, s.name AS session_name FROM holidays h LEFT JOIN sessions s ON s.id = h.session_id WHERE h.session_id = ? OR h.session_id IS NULL ORDER BY h.date ASC"
        )
        .bind(sessionId)
        .all());
    } else {
      ({ results } = await db
        .prepare(
          "SELECT h.*, s.name AS session_name FROM holidays h LEFT JOIN sessions s ON s.id = h.session_id ORDER BY h.date ASC"
        )
        .all());
    }

    return NextResponse.json({ holidays: results });
  } catch (error) {
    console.error("GET holidays error:", error);
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
    const enabled = isEnabled === undefined || isEnabled === null ? 1 : isEnabled ? 1 : 0;

    const result = await db
      .prepare(
        "INSERT INTO holidays (session_id, holiday_name, description, date, end_date, year, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        sessionId || null,
        holidayName,
        description || null,
        date,
        endDate || null,
        year || null,
        enabled
      )
      .run();

    const holiday = await db
      .prepare("SELECT * FROM holidays WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ holiday }, { status: 201 });
  } catch (error) {
    console.error("POST holiday error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
