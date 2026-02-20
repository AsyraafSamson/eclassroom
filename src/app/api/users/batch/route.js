import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

    const { users } = await request.json();

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: "Users array is required" },
        { status: 400 }
      );
    }

    if (users.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 users per batch" },
        { status: 400 }
      );
    }

    const db = await getDB();

    // Fetch existing usernames and emails to skip duplicates
    const { results: existingUsers } = await db
      .prepare("SELECT username, email FROM users")
      .all();

    const existingUsernames = new Set(
      existingUsers.map((u) => u.username?.toLowerCase()).filter(Boolean)
    );
    const existingEmails = new Set(
      existingUsers.map((u) => u.email?.toLowerCase()).filter(Boolean)
    );

    let created = 0;
    let skipped = 0;
    const skippedDetails = [];

    for (const row of users) {
      const username = (row.username || "").trim();
      if (!username) {
        skipped++;
        skippedDetails.push("Empty username");
        continue;
      }

      const password = row.password || `${username}@123456`;
      const email = (row.email || `${username}@ilkkm.edu.my`).trim();
      const fullName = (row.full_name || "").trim();
      const role = row.role === "admin" ? "admin" : "user";

      if (existingUsernames.has(username.toLowerCase())) {
        skipped++;
        skippedDetails.push(`${username}: username exists`);
        continue;
      }

      if (existingEmails.has(email.toLowerCase())) {
        skipped++;
        skippedDetails.push(`${username}: email exists`);
        continue;
      }

      // Mark as used to prevent duplicates within the same batch
      existingUsernames.add(username.toLowerCase());
      existingEmails.add(email.toLowerCase());

      const passwordHash = await bcrypt.hash(password, 10);

      try {
        await db
          .prepare(
            "INSERT INTO users (username, email, password_hash, full_name, role, must_change_password) VALUES (?, ?, ?, ?, ?, 1)"
          )
          .bind(username, email, passwordHash, fullName, role)
          .run();
        created++;
      } catch (err) {
        skipped++;
        skippedDetails.push(`${username}: ${err.message}`);
      }
    }

    return NextResponse.json({ created, skipped, skippedDetails });
  } catch (error) {
    console.error("Batch create users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
