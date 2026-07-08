import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCaption, type Violation } from "@/lib/validate";
import type { Client } from "@/lib/types";

export const runtime = "nodejs";

type Body = { client_id?: string; format?: string; theme?: string };
type Suggestion = { caption: string; violations: Violation[] };

function buildSystemPrompt(c: Client): string {
  const rules = (c.hard_rules ?? []).filter(Boolean);
  const tags = (c.hashtags_fix ?? []).filter(Boolean);
  const lines = [
    `Du bist Social-Media-Redakteur für „${c.name}“${c.handle ? ` (${c.handle})` : ""}.`,
    c.branche ? `Branche: ${c.branche}.` : "",
    c.voice ? `\nTonalität / Voice:\n${c.voice}` : "",
    c.facts ? `\nFakten über den Kunden (nur nutzen, wenn sie passen — nichts erfinden):\n${c.facts}` : "",
    c.cta ? `\nStandard-CTA: ${c.cta}` : "",
    tags.length ? `\nDiese festen Hashtags MÜSSEN wörtlich am Ende jeder Caption stehen:\n${tags.join(" ")}` : "",
    rules.length
      ? `\nHARTE REGELN — jede Caption muss ALLE einhalten, ohne Ausnahme:\n${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
      : "",
    `\nGenerelle Regeln:\n- Verwende NIEMALS einen Gedankenstrich (– oder —). Nur normale Bindestriche.\n- Schreibe auf Deutsch, natürlich und plattformgerecht.\n- Keine Emojis erfinden, die nicht zur Marke passen.`,
    `\nGib AUSSCHLIESSLICH gültiges JSON zurück, exakt in diesem Format, ohne Markdown, ohne Kommentar:\n{"captions": ["...", "...", "..."]}\nGenau 3 unterschiedliche Caption-Vorschläge.`,
  ];
  return lines.filter(Boolean).join("\n");
}

function extractText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function parseCaptions(text: string): string[] {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Keine JSON-Antwort vom Modell.");
  const parsed = JSON.parse(text.slice(start, end + 1));
  const caps = parsed?.captions;
  if (!Array.isArray(caps)) throw new Error("Antwort enthält kein captions-Array.");
  return caps.map((x) => String(x).trim()).filter(Boolean);
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY fehlt in .env.local — bitte eintragen und Dev-Server neu starten." },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const { client_id, format, theme } = body;
  if (!client_id) {
    return NextResponse.json({ error: "client_id fehlt." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: client, error: dbErr } = await supabase
    .from("clients")
    .select("*")
    .eq("id", client_id)
    .single<Client>();

  if (dbErr || !client) {
    return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });
  }

  const userMsg = [
    `Format: ${format || "Story"}.`,
    theme ? `Thema/Anlass: ${theme}.` : "Kein spezifisches Thema — wähle etwas Passendes zur Marke.",
    "Schreibe jetzt 3 Caption-Vorschläge.",
  ].join(" ");

  const anthropic = new Anthropic({ apiKey });

  try {
    const msg = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: buildSystemPrompt(client), cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMsg }],
    });

    const captions = parseCaptions(extractText(msg.content));
    const suggestions: Suggestion[] = captions.slice(0, 3).map((caption) => ({
      caption,
      violations: validateCaption(caption, client),
    }));

    return NextResponse.json({ suggestions });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Anthropic-Fehler: ${e.message}` }, { status: e.status ?? 502 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Generierung fehlgeschlagen." }, { status: 500 });
  }
}
