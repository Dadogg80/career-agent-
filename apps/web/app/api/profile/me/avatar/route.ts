import { localRequest, mappedPrivateError, privateBase, privateResponse, sessionHeaders } from "../../../../../lib/private-api";

const maxImageBytes = 2_000_000;
const maxStoredBytes = 500_000;
const allowedTypes = new Set(["image/jpeg", "image/png"]);

function rejected(code: string, status: number) {
  return privateResponse({ code }, undefined, status);
}

async function upstreamError(response: Response) {
  let value: unknown = null;
  try {
    value = await response.json();
  } catch {
    return rejected("PROFILE_AVATAR_UNAVAILABLE", 503);
  }
  const status = [400, 401, 403, 404, 409, 413, 503].includes(response.status) ? response.status : 503;
  return privateResponse(mappedPrivateError(value), response, status);
}

export async function GET(request: Request) {
  if (!localRequest(request)) return rejected("ACCESS_DENIED", 403);
  try {
    const upstream = await fetch(`${privateBase()}/api/profile/me/avatar`, {
      headers: sessionHeaders(request),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok) return upstreamError(upstream);
    const image = await upstream.arrayBuffer();
    if (image.byteLength < 1 || image.byteLength > maxStoredBytes || upstream.headers.get("content-type") !== "image/jpeg") {
      return rejected("PROFILE_AVATAR_UNAVAILABLE", 503);
    }
    return new Response(image, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "image/jpeg",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return rejected("PROFILE_AVATAR_UNAVAILABLE", 503);
  }
}

export async function PUT(request: Request) {
  if (!localRequest(request)) return rejected("ACCESS_DENIED", 403);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxImageBytes + 65536) return rejected("PROFILE_AVATAR_TOO_LARGE", 413);
  try {
    const form = await request.formData();
    const entries = [...form.entries()];
    if (entries.length !== 1 || entries[0][0] !== "file" || !(entries[0][1] instanceof File)) {
      return rejected("PROFILE_AVATAR_INVALID", 400);
    }
    const file = entries[0][1];
    if (file.size < 1) return rejected("PROFILE_AVATAR_INVALID", 400);
    if (file.size > maxImageBytes) return rejected("PROFILE_AVATAR_TOO_LARGE", 413);
    if (!allowedTypes.has(file.type)) return rejected("PROFILE_AVATAR_INVALID", 400);
    const body = new FormData();
    body.set("file", file, file.type === "image/png" ? "profile-avatar.png" : "profile-avatar.jpg");
    const upstream = await fetch(`${privateBase()}/api/profile/me/avatar`, {
      method: "PUT",
      headers: sessionHeaders(request),
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok) return upstreamError(upstream);
    const value: unknown = await upstream.json();
    if (!value || typeof value !== "object" || !("updated" in value) || value.updated !== true) {
      return rejected("PROFILE_AVATAR_UNAVAILABLE", 503);
    }
    return privateResponse({ updated: true }, upstream);
  } catch {
    return rejected("PROFILE_AVATAR_UNAVAILABLE", 503);
  }
}

export async function DELETE(request: Request) {
  if (!localRequest(request)) return rejected("ACCESS_DENIED", 403);
  try {
    const upstream = await fetch(`${privateBase()}/api/profile/me/avatar`, {
      method: "DELETE",
      headers: sessionHeaders(request),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
    if (upstream.status === 204) return privateResponse(null, upstream, 204);
    return upstreamError(upstream);
  } catch {
    return rejected("PROFILE_AVATAR_UNAVAILABLE", 503);
  }
}
