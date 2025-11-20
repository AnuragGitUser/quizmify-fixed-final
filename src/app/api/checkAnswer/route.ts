// src/app/api/checkAnswer/route.ts
import { prisma } from "@/lib/db";
import { checkAnswerSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Lightweight string similarity using Dice coefficient on bigrams */
function compareTwoStrings(a: string, b: string) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (a === b) return 1;

  function bigrams(s: string) {
    const out: string[] = [];
    for (let i = 0; i < s.length - 1; i++) out.push(s.substring(i, i + 2));
    return out;
  }

  const aB = bigrams(a);
  const bB = bigrams(b);
  if (aB.length === 0 || bB.length === 0) return a === b ? 1 : 0;

  const map = new Map<string, number>();
  for (const g of aB) map.set(g, (map.get(g) || 0) + 1);
  let intersection = 0;
  for (const g of bB) {
    const v = map.get(g) || 0;
    if (v > 0) {
      intersection++;
      map.set(g, v - 1);
    }
  }
  return (2.0 * intersection) / (aB.length + bB.length);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { questionId, userInput } = checkAnswerSchema.parse(body);
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    await prisma.question.update({
      where: { id: questionId },
      data: { userAnswer: userInput },
    });

    if (question.questionType === "mcq") {
      const isCorrect =
        question.answer.toLowerCase().trim() === userInput.toLowerCase().trim();
      await prisma.question.update({
        where: { id: questionId },
        data: { isCorrect },
      });
      return NextResponse.json({ isCorrect });
    } else if (question.questionType === "open_ended") {
      let percentageSimilar = compareTwoStrings(
        question.answer.toLowerCase().trim(),
        userInput.toLowerCase().trim()
      );
      percentageSimilar = Math.round(percentageSimilar * 100);
      await prisma.question.update({
        where: { id: questionId },
        data: { percentageCorrect: percentageSimilar },
      });
      return NextResponse.json({ percentageSimilar });
    }

    return NextResponse.json(
      { message: "Unsupported question type" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: error.issues }, { status: 400 });
    }
    console.error("checkAnswer error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
