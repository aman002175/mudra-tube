import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const envUser = process.env.ADMIN_USERNAME;
    const envPass = process.env.ADMIN_PASSWORD;

    // If custom credentials are set in Vercel Environment Variables, strictly require them!
    // Otherwise fallback to starter credentials for fresh setup
    const isValid = (envUser && envPass)
      ? (username === envUser && password === envPass)
      : (
          (username === "admin29" && password === "admin123") ||
          (username === "admin" && password === "mudratube2026")
        );

    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid Admin Username or Password" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Authentication error" },
      { status: 500 }
    );
  }
}
