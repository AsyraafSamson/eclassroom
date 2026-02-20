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

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const today = new Date().toISOString().slice(0, 10);

    // Count active bookings (from today onwards) in this session
    const activeRow = await db
      .prepare(
        "SELECT COUNT(*) AS cnt FROM bookings WHERE user_id = ? AND session_id = ? AND booking_date >= ?"
      )
      .bind(user.id, sessionId, today)
      .first();

    // Count total bookings (including past) in this session
    const totalRow = await db
      .prepare(
        "SELECT COUNT(*) AS cnt FROM bookings WHERE user_id = ? AND session_id = ?"
      )
      .bind(user.id, sessionId)
      .first();

    return NextResponse.json({
      activeCount: activeRow?.cnt || 0,
      totalCount: totalRow?.cnt || 0,
      limit: 20,
    });
  } catch (error) {
    console.error("GET booking count error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
