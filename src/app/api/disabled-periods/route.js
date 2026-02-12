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
          "SELECT dp.*, s.name AS session_name FROM disabled_periods dp LEFT JOIN sessions s ON s.id = dp.session_id WHERE dp.session_id = ? ORDER BY dp.period_value ASC"
        )
        .bind(sessionId)
        .all());
    } else {
      ({ results } = await db
        .prepare(
          "SELECT dp.*, s.name AS session_name FROM disabled_periods dp LEFT JOIN sessions s ON s.id = dp.session_id ORDER BY dp.session_id DESC, dp.period_value ASC"
        )
        .all());
    }

    return NextResponse.json({ disabledPeriods: results });
  } catch (error) {
    console.error("GET disabled periods error:", error);
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

    const { sessionId, periodType, periodValue } = await request.json();

    if (!sessionId || !periodType || !periodValue) {
      return NextResponse.json(
        { error: "Session, period type, and period value are required" },
        { status: 400 }
      );
    }

    if (!["day", "week", "month"].includes(periodType)) {
      return NextResponse.json(
        { error: "Period type must be day, week, or month" },
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
        "INSERT INTO disabled_periods (session_id, period_type, period_value) VALUES (?, ?, ?)"
      )
      .bind(sessionId, periodType, periodValue)
      .run();

    const period = await db
      .prepare("SELECT * FROM disabled_periods WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ disabledPeriod: period }, { status: 201 });
  } catch (error) {
    console.error("POST disabled period error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
