/** API base — empty string = same origin (production single-server deploy) */
export function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env !== undefined && env !== "") return env;
  if (typeof window !== "undefined") return "";
  return "http://localhost:8787";
}
