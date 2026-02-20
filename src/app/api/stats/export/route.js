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

    const db = await getDB();

    const hasDateFilter = startDate && endDate;
    const dateWhere = hasDateFilter
      ? "AND b.booking_date BETWEEN ? AND ?"
      : "";
    const dateBindings = hasDateFilter ? [startDate, endDate] : [];

    // Fetch all bookings for the filtered period
    const { results: bookings } = await db
      .prepare(
        `SELECT b.booking_date, t.label AS time_slot, t.start_time, t.end_time,
                c.name AS room_name, rg.name AS group_name,
                b.teacher_name, b.purpose, b.status,
                u.full_name AS booked_by
         FROM bookings b
         JOIN time_slots t ON t.id = b.time_slot_id
         JOIN classrooms c ON c.id = b.classroom_id
         JOIN users u ON u.id = b.user_id
         LEFT JOIN room_groups rg ON rg.id = c.group_id
         WHERE 1=1 ${dateWhere}
         ORDER BY b.booking_date, t.start_time`
      )
      .bind(...dateBindings)
      .all();

    // Fetch room statistics grouped by room group
    const { results: roomStats } = await db
      .prepare(
        `SELECT rg.name AS group_name, c.name AS room_name,
                COUNT(b.id) AS booking_count
         FROM room_groups rg
         JOIN classrooms c ON rg.id = c.group_id
         LEFT JOIN bookings b ON c.id = b.classroom_id ${dateWhere ? "AND b.booking_date BETWEEN ? AND ?" : ""}
         GROUP BY rg.name, c.name
         ORDER BY rg.name, booking_count DESC`
      )
      .bind(...(hasDateFilter ? [startDate, endDate] : []))
      .all();

    function escapeCsv(value) {
      const str = value == null ? "" : String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const lines = [];

    // Report header
    if (hasDateFilter) {
      lines.push(`Booking Report: ${startDate} to ${endDate}`);
    } else {
      lines.push("Booking Report: All Time");
    }
    lines.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
    lines.push(`Total Bookings: ${bookings.length}`);
    lines.push("");

    // Booking details section
    lines.push("BOOKING DETAILS");
    lines.push(
      [
        "Booking Date",
        "Time Slot",
        "Start Time",
        "End Time",
        "Room",
        "Teacher",
        "Purpose",
        "Status",
        "Booked By",
      ].join(",")
    );

    for (const row of bookings) {
      lines.push(
        [
          row.booking_date,
          row.time_slot,
          row.start_time,
          row.end_time,
          row.room_name,
          row.teacher_name,
          row.purpose,
          row.status,
          row.booked_by,
        ]
          .map(escapeCsv)
          .join(",")
      );
    }

    // Room statistics section
    lines.push("");
    lines.push("ROOM STATISTICS");
    lines.push(["Room Group", "Room Name", "Total Bookings"].join(","));

    for (const row of roomStats) {
      lines.push(
        [row.group_name, row.room_name, row.booking_count]
          .map(escapeCsv)
          .join(",")
      );
    }

    const csv = lines.join("\r\n");
    const filename = `Booking_Report_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
