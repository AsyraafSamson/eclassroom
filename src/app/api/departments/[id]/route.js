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
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    const existing = await db
      .prepare("SELECT id FROM departments WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    const duplicate = await db
      .prepare("SELECT id FROM departments WHERE name = ? AND id != ?")
      .bind(name.trim(), id)
      .first();

    if (duplicate) {
      return NextResponse.json(
        { error: "Department name already exists" },
        { status: 409 }
      );
    }

    await db
      .prepare("UPDATE departments SET name = ? WHERE id = ?")
      .bind(name.trim(), id)
      .run();

    const department = await db
      .prepare("SELECT * FROM departments WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({ department });
  } catch (error) {
    console.error("PUT department error:", error);
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
      .prepare("SELECT id FROM departments WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    await db.prepare("DELETE FROM departments WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE department error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
