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
    const { name, description, classroomId } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Equipment name is required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const existing = await db
      .prepare("SELECT id FROM equipment WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    await db
      .prepare(
        "UPDATE equipment SET name = ?, description = ?, classroom_id = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .bind(name.trim(), description || null, classroomId || null, id)
      .run();

    const equipment = await db
      .prepare("SELECT * FROM equipment WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error("PUT equipment error:", error);
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
      .prepare("SELECT id FROM equipment WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    await db.prepare("DELETE FROM equipment WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE equipment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
