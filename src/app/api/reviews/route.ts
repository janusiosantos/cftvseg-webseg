import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  serviceRecordId: z.string(),
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = reviewSchema.parse(body);

    const serviceRecord = await prisma.serviceRecord.findUnique({
      where: { id: data.serviceRecordId },
    });

    if (!serviceRecord) {
      return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
    }

    if (serviceRecord.reviewScore) {
      return NextResponse.json({ error: "Você já avaliou este serviço." }, { status: 400 });
    }

    await prisma.serviceRecord.update({
      where: { id: data.serviceRecordId },
      data: {
        reviewScore: data.score,
        reviewComment: data.comment,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
