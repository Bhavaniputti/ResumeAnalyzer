import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface Message {
  role: string;
  content: string;
}

async function callGroq(system: string, user: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function parseJSON(text: string): Record<string, unknown> {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.split("```")[1] ?? t;
    if (t.startsWith("json")) t = t.slice(4);
  }
  return JSON.parse(t.trim());
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    let system = "";
    let user = "";

    switch (action) {
      case "analyze": {
        system = "You are an expert ATS and career coach AI. Return ONLY valid JSON. No markdown.";
        user = `Analyze this resume against the job description.\nResume:\n${(body.resume_text ?? "").slice(0, 3000)}\nJob Description:\n${(body.job_description ?? "").slice(0, 2000)}\n\nReturn JSON: {"match_score":<0-100>,"ats_score":<0-100>,"matched_skills":[],"missing_skills":[],"strengths":[],"weaknesses":[],"recommendations":[],"final_recommendation":"<Highly/Moderately/Not Suitable>"}`;
        break;
      }
      case "ats": {
        system = "You are an ATS expert. Return ONLY valid JSON.";
        user = `Analyze this resume for ATS compatibility.\nResume:\n${(body.resume_text ?? "").slice(0, 3000)}\n${body.job_description ? `Job Description:\n${body.job_description.slice(0, 1500)}` : ""}\n\nReturn JSON: {"ats_score":<0-100>,"keywords":[],"missing_keywords":[],"missing_sections":[],"formatting_issues":[],"suggestions":[]}`;
        break;
      }
      case "roles": {
        system = "You are a career advisor. Return ONLY valid JSON.";
        user = `Recommend job roles based on this resume.\nResume:\n${(body.resume_text ?? "").slice(0, 3000)}\n\nReturn JSON: {"roles":[{"title":"","match":<0-100>,"reason":""}]}\nInclude 6-8 roles.`;
        break;
      }
      case "interview": {
        system = "You are an interview coach. Return ONLY valid JSON.";
        user = `Generate interview questions for ${body.role ?? "a role"}.\nResume:\n${(body.resume_text ?? "").slice(0, 2000)}\n\nReturn JSON: {"questions":[{"question":"","category":"Technical|Behavioral|Situational","difficulty":"Easy|Medium|Hard"}]}\nInclude 8-10 questions.`;
        break;
      }
      case "chat": {
        const hist = ((body.history ?? []) as Message[]).slice(-6).map((m: Message) => `${m.role}: ${m.content}`).join("\n");
        system = "You are an AI career assistant. Answer based on the resume. Be concise and helpful.";
        user = `Resume:\n${(body.resume_text ?? "").slice(0, 2000)}\nConversation:\n${hist}\nQuestion: ${body.message ?? ""}`;
        const answer = await callGroq(system, user);
        return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const raw = await callGroq(system, user);
    const result = parseJSON(raw);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
