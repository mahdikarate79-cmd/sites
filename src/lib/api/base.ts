/** API base — production fallback when env not baked into build */
export function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env !== undefined && env !== "") return env.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "x.venify.xyz" || host.endsWith(".venify.xyz")) {
      return "https://api.venify.xyz";
    }
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8787";
    }
    return "";
  }
  return "http://localhost:8787";
}
