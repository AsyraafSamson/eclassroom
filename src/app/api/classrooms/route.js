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
    const groupId = searchParams.get("groupId");

    const db = await getDB();
    let results;

    if (groupId) {
      ({ results } = await db
        .prepare(
          "SELECT c.*, rg.name AS group_name FROM classrooms c LEFT JOIN room_groups rg ON rg.id = c.group_id WHERE c.group_id = ? ORDER BY c.name ASC"
        )
        .bind(groupId)
        .all());
    } else {
      ({ results } = await db
        .prepare(
          "SELECT c.*, rg.name AS group_name FROM classrooms c LEFT JOIN room_groups rg ON rg.id = c.group_id ORDER BY c.name ASC"
        )
        .all());
    }

    return NextResponse.json({ classrooms: results });
  } catch (error) {
    console.error("GET classrooms error:", error);
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

    const { name, location, capacity, description, status } =
      await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const normalizedStatus = status || "available";
    if (!["available", "maintenance"].includes(normalizedStatus)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const normalizedCapacity =
      capacity === null || capacity === undefined || capacity === ""
        ? null
        : Number(capacity);

    if (!Number.isInteger(normalizedCapacity) || normalizedCapacity < 0) {
      return NextResponse.json(
        { error: "Capacity must be a non-negative integer" },
        { status: 400 }
      );
    }

    const db = await getDB();
    const result = await db
      .prepare(
        "INSERT INTO classrooms (name, location, capacity, description, status) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(
        name,
        location || null,
        normalizedCapacity,
        description || null,
        normalizedStatus
      )
      .run();

    const classroom = await db
      .prepare("SELECT * FROM classrooms WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ classroom }, { status: 201 });
  } catch (error) {
    console.error("POST classroom error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
