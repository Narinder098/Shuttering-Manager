import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    revenue: 12450,
    rentals: 23,
    dues: 3200,
    daily: [4, 6, 8, 5, 7, 9, 6],
  });
}
