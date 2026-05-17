import { prisma } from "@/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIpFromHeaders } from "@/lib/request-client";

export async function GET(req: NextRequest) {
  const clientIp = getClientIpFromHeaders(req.headers);
  const userAgent = req.headers.get("user-agent")?.trim().slice(0, 160) || "unknown";
  const rateLimit = checkRateLimit({
    key: `search:${clientIp}:${userAgent}`,
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many search requests. Please slow down." }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (q && q.length > 80) {
    return NextResponse.json({ error: "Search query is too long." }, { status: 400 });
  }

  if (!q) {
    const footballers = await prisma.footballer.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        profileImage: true,
        products: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { id: true },
        },
      },
    });
    return NextResponse.json({ footballers });
  }

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      name: { contains: q, mode: "insensitive" },
    },
    take: 6,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      capImage1: true,
      price: true,
      footballer: { select: { name: true } },
    },
  });

  return NextResponse.json({
    products: products.map((p) => ({ ...p, price: Number(p.price) })),
  });
}
