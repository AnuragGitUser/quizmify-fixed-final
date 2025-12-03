import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Not Authenticated", { status: 401 });

  const { title, options, correctAnswer } = body;

  const { data, error } = await supabase
    .from("Question")
    .insert({
      title,
      options,
      correctAnswer,
      userId: user.id   // IMPORTANT!!!
    })
    .select("*")
    .single();

  if (error) return new Response(JSON.stringify(error), { status: 500 });

  return new Response(JSON.stringify(data), { status: 200 });
}
