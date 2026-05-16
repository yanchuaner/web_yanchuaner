import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const id = req.url.split("/").pop();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true, title: true, summary: true, content: true,
        location: true, eventDate: true, endDate: true,
        coverImage: true, maxAttendees: true, status: true,
        _count: { select: { registrations: true } },
      },
    });

    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      ...event,
      registrationCount: event._count.registrations,
      _count: undefined,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const id = req.url.split("/").pop();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json();
    const { name, contact, message } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (event.maxAttendees) {
      const count = await prisma.eventRegistration.count({ where: { eventId: id } });
      if (count >= event.maxAttendees) {
        return NextResponse.json({ error: "报名已满" }, { status: 400 });
      }
    }

    const registration = await prisma.eventRegistration.create({
      data: { eventId: id, name: name.trim(), contact: contact?.trim() || null, message: message?.trim() || null },
    });

    return NextResponse.json({ success: true, registration }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
