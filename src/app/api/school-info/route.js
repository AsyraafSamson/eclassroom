import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET() {
  try {
    // Public endpoint — site branding is needed on login page
    const db = await getDB();
    const schoolInfo = await db
      .prepare("SELECT * FROM school_info WHERE id = 1")
      .first();

    return NextResponse.json({
      schoolInfo: schoolInfo || {
        id: 1,
        site_title: "eClassroom",
        school_name: "My School",
        website: null,
        logo: null,
        login_message: null,
      },
    });
  } catch (error) {
    console.error("GET school info error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { siteTitle, schoolName, website, logo, loginMessage } =
      await request.json();

    const db = await getDB();

    await db
      .prepare(
        `UPDATE school_info
         SET site_title = ?, school_name = ?, website = ?, logo = ?, login_message = ?,
             updated_at = datetime('now')
         WHERE id = 1`
      )
      .bind(
        siteTitle || "eClassroom",
        schoolName || "My School",
        website || null,
        logo || null,
        loginMessage || null
      )
      .run();

    const schoolInfo = await db
      .prepare("SELECT * FROM school_info WHERE id = 1")
      .first();

    return NextResponse.json({ schoolInfo });
  } catch (error) {
    console.error("PUT school info error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
