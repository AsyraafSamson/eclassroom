import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getDB();

    // Run all stats queries in parallel via batch
    const [
      totalBookings,
      totalUsers,
      totalClassrooms,
      statusBreakdown,
      topRooms,
      topUsers,
      monthlyBookings,
    ] = await Promise.all([
      db.prepare("SELECT COUNT(*) AS count FROM bookings").first(),
      db.prepare("SELECT COUNT(*) AS count FROM users").first(),
      db.prepare("SELECT COUNT(*) AS count FROM classrooms").first(),
      db
        .prepare(
          "SELECT status, COUNT(*) AS count FROM bookings GROUP BY status ORDER BY count DESC"
        )
        .all()
        .then((r) => r.results),
      db
        .prepare(
          `SELECT c.name, COUNT(b.id) AS booking_count
           FROM bookings b
           JOIN classrooms c ON c.id = b.classroom_id
           GROUP BY b.classroom_id
           ORDER BY booking_count DESC
           LIMIT 10`
        )
        .all()
        .then((r) => r.results),
      db
        .prepare(
          `SELECT u.full_name, u.email, COUNT(b.id) AS booking_count
           FROM bookings b
           JOIN users u ON u.id = b.user_id
           GROUP BY b.user_id
           ORDER BY booking_count DESC
           LIMIT 10`
        )
        .all()
        .then((r) => r.results),
      db
        .prepare(
          `SELECT substr(booking_date, 1, 7) AS month, COUNT(*) AS count
           FROM bookings
           GROUP BY month
           ORDER BY month DESC
           LIMIT 12`
        )
        .all()
        .then((r) => r.results),
    ]);

    return NextResponse.json({
      stats: {
        totalBookings: totalBookings?.count || 0,
        totalUsers: totalUsers?.count || 0,
        totalClassrooms: totalClassrooms?.count || 0,
        statusBreakdown: statusBreakdown || [],
        topRooms: topRooms || [],
        topUsers: topUsers || [],
        monthlyBookings: (monthlyBookings || []).reverse(),
      },
    });
  } catch (error) {
    console.error("GET stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
