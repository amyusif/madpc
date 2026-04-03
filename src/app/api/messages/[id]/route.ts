import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const message = await prisma.message.findUnique({
      where: { id },
      include: { recipients: true },
    });
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    return NextResponse.json({ message });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch message" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Recipients are cascade-deleted via the Prisma schema relation
    await prisma.message.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Delete message error:", e);
    return NextResponse.json({ error: e?.message || "Failed to delete message" }, { status: 500 });
  }
}
