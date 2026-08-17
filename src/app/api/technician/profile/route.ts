import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { compare, hash } from "bcryptjs";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "A senha atual é obrigatória"),
  newPassword: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres"),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TECHNICIAN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = passwordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await compare(data.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "A senha atual está incorreta." }, { status: 400 });
    }

    // Hash new password
    const newPasswordHash = await hash(data.newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({ success: true, message: "Senha alterada com sucesso!" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: (error as any).errors }, { status: 400 });
    }
    console.error("[Technician Profile API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
