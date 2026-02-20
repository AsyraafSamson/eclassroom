import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const all = searchParams.get("all") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 10;

    const db = await getDB();
    const hasDateFilter = startDate && endDate;

    // Build date filter clause
    const dateWhere = hasDateFilter
      ? "AND b.booking_date BETWEEN ? AND ?"
      : "";
    const dateBindings = hasDateFilter ? [startDate, endDate] : [];

    // Run all stats queries in parallel
    const [
      totalBookings,
      totalUsers,
      totalClassrooms,
      statusBreakdown,
      topRooms,
      topUsers,
      monthlyBookings,
      filteredSummary,
      bookingsCount,
      bookingsPage,
    ] = await Promise.all([
      // All-time totals
      db.prepare("SELECT COUNT(*) AS count FROM bookings").first(),
      db.prepare("SELECT COUNT(*) AS count FROM users").first(),
      db.prepare("SELECT COUNT(*) AS count FROM classrooms").first(),

      // Status breakdown (filtered)
      db
        .prepare(
          `SELECT status, COUNT(*) AS count FROM bookings b WHERE 1=1 ${dateWhere} GROUP BY status ORDER BY count DESC`
        )
        .bind(...dateBindings)
        .all()
        .then((r) => r.results),

      // Top rooms (filtered)
      db
        .prepare(
          `SELECT c.name, COUNT(b.id) AS booking_count
           FROM bookings b
           JOIN classrooms c ON c.id = b.classroom_id
           WHERE 1=1 ${dateWhere}
           GROUP BY b.classroom_id
           ORDER BY booking_count DESC
           LIMIT 10`
        )
        .bind(...dateBindings)
        .all()
        .then((r) => r.results),

      // Top users (filtered)
      db
        .prepare(
          `SELECT u.full_name, u.email, COUNT(b.id) AS booking_count
           FROM bookings b
           JOIN users u ON u.id = b.user_id
           WHERE 1=1 ${dateWhere}
           GROUP BY b.user_id
           ORDER BY booking_count DESC
           LIMIT 10`
        )
        .bind(...dateBindings)
        .all()
        .then((r) => r.results),

      // Monthly bookings (last 12 months, always unfiltered for trend chart)
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

      // Filtered summary metrics
      hasDateFilter
        ? db
            .prepare(
              `SELECT
                 COUNT(*) AS totalBookings,
                 COUNT(DISTINCT b.classroom_id) AS totalRooms,
                 COUNT(DISTINCT b.booking_date) AS totalDays
               FROM bookings b
               WHERE b.booking_date BETWEEN ? AND ?`
            )
            .bind(startDate, endDate)
            .first()
        : Promise.resolve(null),

      // Bookings list count (filtered)
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM bookings b WHERE 1=1 ${dateWhere}`
        )
        .bind(...dateBindings)
        .first(),

      // Bookings list (filtered) - all or paginated based on 'all' parameter
      all
        ? db
            .prepare(
              `SELECT b.booking_date, t.label AS time_slot, t.start_time, t.end_time,
                      c.name AS room_name, b.teacher_name, b.purpose, b.status,
                      u.full_name AS booked_by
               FROM bookings b
               JOIN time_slots t ON t.id = b.time_slot_id
               JOIN classrooms c ON c.id = b.classroom_id
               JOIN users u ON u.id = b.user_id
               WHERE 1=1 ${dateWhere}
               ORDER BY b.booking_date DESC, t.start_time`
            )
            .bind(...dateBindings)
            .all()
            .then((r) => r.results)
        : db
            .prepare(
              `SELECT b.booking_date, t.label AS time_slot, t.start_time, t.end_time,
                      c.name AS room_name, b.teacher_name, b.purpose, b.status,
                      u.full_name AS booked_by
               FROM bookings b
               JOIN time_slots t ON t.id = b.time_slot_id
               JOIN classrooms c ON c.id = b.classroom_id
               JOIN users u ON u.id = b.user_id
               WHERE 1=1 ${dateWhere}
               ORDER BY b.booking_date DESC, t.start_time
               LIMIT ? OFFSET ?`
            )
            .bind(...dateBindings, pageSize, (page - 1) * pageSize)
            .all()
            .then((r) => r.results),
    ]);

    const bookingsTotal = bookingsCount?.count || 0;

    return NextResponse.json({
      stats: {
        totalBookings: totalBookings?.count || 0,
        totalUsers: totalUsers?.count || 0,
        totalClassrooms: totalClassrooms?.count || 0,
        statusBreakdown: statusBreakdown || [],
        topRooms: topRooms || [],
        topUsers: topUsers || [],
        monthlyBookings: (monthlyBookings || []).reverse(),
        filteredSummary: filteredSummary || null,
        bookings: bookingsPage || [],
        bookingsPagination: {
          page,
          pageSize,
          total: bookingsTotal,
          totalPages: Math.ceil(bookingsTotal / pageSize),
        },
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
