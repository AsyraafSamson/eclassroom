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
    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const existing = await db
      .prepare("SELECT id FROM room_groups WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Room group not found" },
        { status: 404 }
      );
    }

    const duplicate = await db
      .prepare("SELECT id FROM room_groups WHERE name = ? AND id != ?")
      .bind(name.trim(), id)
      .first();

    if (duplicate) {
      return NextResponse.json(
        { error: "Group name already exists" },
        { status: 409 }
      );
    }

    await db
      .prepare("UPDATE room_groups SET name = ?, description = ? WHERE id = ?")
      .bind(name.trim(), description || null, id)
      .run();

    const roomGroup = await db
      .prepare("SELECT * FROM room_groups WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({ roomGroup });
  } catch (error) {
    console.error("PUT room group error:", error);
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
      .prepare("SELECT id FROM room_groups WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Room group not found" },
        { status: 404 }
      );
    }

    await db.prepare("DELETE FROM room_groups WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE room group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
