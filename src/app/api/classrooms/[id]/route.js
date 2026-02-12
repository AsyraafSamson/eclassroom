import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDB();
    const classroom = await db
      .prepare("SELECT * FROM classrooms WHERE id = ?")
      .bind(id)
      .first();

    if (!classroom) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ classroom });
  } catch (error) {
    console.error("GET classroom error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const existing = await db
      .prepare("SELECT * FROM classrooms WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 }
      );
    }

    await db
      .prepare(
        "UPDATE classrooms SET name = ?, location = ?, capacity = ?, description = ?, status = ? WHERE id = ?"
      )
      .bind(
        name,
        location || null,
        normalizedCapacity,
        description || null,
        normalizedStatus,
        id
      )
      .run();

    const classroom = await db
      .prepare("SELECT * FROM classrooms WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({ classroom });
  } catch (error) {
    console.error("PUT classroom error:", error);
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
      .prepare("SELECT * FROM classrooms WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 }
      );
    }

    await db.prepare("DELETE FROM classrooms WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE classroom error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
