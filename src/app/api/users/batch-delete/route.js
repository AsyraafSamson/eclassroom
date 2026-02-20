import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "userIds array is required" },
        { status: 400 }
      );
    }

    // Filter out current user's ID to prevent self-deletion
    const idsToDelete = userIds
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id) && id !== user.id);

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { error: "No valid users to delete" },
        { status: 400 }
      );
    }

    const db = await getDB();

    let deleted = 0;
    for (const id of idsToDelete) {
      try {
        await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
        deleted++;
      } catch (err) {
        console.error(`Failed to delete user ${id}:`, err);
      }
    }

    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("Batch delete users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
