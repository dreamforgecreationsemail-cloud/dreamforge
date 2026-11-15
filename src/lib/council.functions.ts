import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { councilConnection } from "./deepseek.server";

export const askCouncil = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({
    text: z.string().trim().min(1).max(16000),
    files: z.array(z.string().max(255)).max(20),
  }).parse(data))
  .handler(async ({ data }): Promise<{ answer: string; error?: string }> => {
    const connection = await councilConnection();
    if (!connection) return { answer: "", error: "DeepSeek is not configured." };
    connection.headers.set("Content-Type", "application/json");
    async function complete(system: string, prompt: string) {
      const response = await fetch(connection!.url, {
        method: "POST", headers: connection!.headers, redirect: "error",
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          model: "deepseek-flash", thinking: { type: "disabled" }, max_tokens: 2200,
          messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const body = await response.json();
      const answer = body.choices?.[0]?.message?.content;
      if (typeof answer !== "string" || !answer.trim() || body.choices[0].finish_reason === "length") throw new Error("Incomplete");
      return answer.trim();
    }
    const request = JSON.stringify({ request: data.text, attachedFileNames: data.files });
    try {
      const draft = await complete("You are Dream, DreamForge’s app-building planner. Produce a practical draft for the user's request. Give concrete build steps or code when requested. You can read the prompt and file names only. Never claim to have run, built or deployed anything.", request);
      const answer = await complete("You are Nyna, DreamForge’s technical reviewer. Check Dream’s draft against the user's request, correct technical errors or missing steps, then return just the finished answer in the user's language. No character names, review commentary or internal deliberation. Never claim work was executed.", JSON.stringify({ request: data.text, draft }));
      return { answer };
    } catch (error) {
      const status = error instanceof Error ? error.message : "";
      return { answer: "", error: status === "402" ? "Your DeepSeek balance is empty." : status === "401" ? "DeepSeek rejected the configured key." : "Could not finish this request. Please try again." };
    }
  });
