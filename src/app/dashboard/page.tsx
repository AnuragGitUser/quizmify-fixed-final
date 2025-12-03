import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Please login</div>;

  const { data: questions, error } = await supabase
    .from("Question")
    .select("*")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Dashboard fetch error", error);
    return <div>Error loading dashboard</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Your Questions</h1>

      {questions?.length === 0 && (
        <p className="text-gray-500 mt-4">No questions yet.</p>
      )}

      <ul className="mt-4 space-y-4">
        {questions?.map((q) => (
          <li key={q.id} className="p-4 border rounded-lg">
            <h2 className="font-semibold">{q.title}</h2>
            <p className="text-sm text-gray-500">
              Created: {new Date(q.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
