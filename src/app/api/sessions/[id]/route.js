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

    const existing = await db
      .prepare("SELECT id FROM sessions WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    await db
      .prepare(
        "UPDATE sessions SET name = ?, start_date = ?, end_date = ? WHERE id = ?"
      )
      .bind(name, startDate, endDate, id)
      .run();

    const session = await db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({ session });
  } catch (error) {
    console.error("PUT session error:", error);
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
      .prepare("SELECT id FROM sessions WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
