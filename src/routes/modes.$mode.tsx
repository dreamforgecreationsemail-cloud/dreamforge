import { createFileRoute, notFound } from "@tanstack/react-router";
import { ModeWorkflow } from "@/components/mode-workflow";
import { isCoreMode, WORKFLOWS } from "@/lib/workflows";

export const Route = createFileRoute("/modes/$mode")({
  loader: ({ params }) => { if (!isCoreMode(params.mode)) throw notFound(); return { mode: params.mode }; },
  head: ({ loaderData }) => { const title = loaderData ? `${WORKFLOWS[loaderData.mode].title} · DreamForge` : "Mode unavailable · DreamForge"; const description = loaderData ? WORKFLOWS[loaderData.mode].status : "This DreamForge mode is unavailable."; return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }; },
  component: ModePage,
});
function ModePage() { const { mode } = Route.useLoaderData(); return <div className="phone-shell"><ModeWorkflow key={mode} mode={mode} /></div>; }