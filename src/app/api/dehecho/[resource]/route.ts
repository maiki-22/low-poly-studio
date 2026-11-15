import { proxyDehecho } from "@/server/dehecho-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource } = await params;
  return proxyDehecho(
    request,
    resource,
    process.env.DEHECHO_API_URL ?? "http://127.0.0.1:8000",
  );
}
