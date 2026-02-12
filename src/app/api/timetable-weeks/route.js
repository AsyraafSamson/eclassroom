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
          "SELECT tw.*, s.name AS session_name FROM timetable_weeks tw LEFT JOIN sessions s ON s.id = tw.session_id WHERE tw.session_id = ? ORDER BY tw.week_number ASC"
        )
        .bind(sessionId)
        .all());
    } else {
      ({ results } = await db
        .prepare(
          "SELECT tw.*, s.name AS session_name FROM timetable_weeks tw LEFT JOIN sessions s ON s.id = tw.session_id ORDER BY tw.session_id DESC, tw.week_number ASC"
        )
        .all());
    }

    return NextResponse.json({ timetableWeeks: results });
  } catch (error) {
    console.error("GET timetable weeks error:", error);
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

    const session = await db
      .prepare("SELECT id FROM sessions WHERE id = ?")
      .bind(sessionId)
      .first();

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const result = await db
      .prepare(
        "INSERT INTO timetable_weeks (session_id, week_number, start_date, end_date, label) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(sessionId, weekNumber, startDate, endDate, label || null)
      .run();

    const week = await db
      .prepare("SELECT * FROM timetable_weeks WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ timetableWeek: week }, { status: 201 });
  } catch (error) {
    console.error("POST timetable week error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
