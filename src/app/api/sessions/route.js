import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = await getDB();
    const { results } = await db
      .prepare("SELECT id, name, start_date, end_date FROM sessions ORDER BY start_date DESC")
      .all();

    return NextResponse.json({ sessions: results });
  } catch (error) {
    console.error("GET sessions error:", error);
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

    const { name, startDate, endDate } = await request.json();

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Name, start date, and end date are required" },
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
    const result = await db
      .prepare(
        "INSERT INTO sessions (name, start_date, end_date) VALUES (?, ?, ?)"
      )
      .bind(name, startDate, endDate)
      .run();

    const session = await db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("POST session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
