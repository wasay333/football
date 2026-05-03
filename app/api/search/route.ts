import { prisma } from "@/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

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
