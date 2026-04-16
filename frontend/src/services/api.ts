const API_URL = import.meta.env.VITE_API_URL || "http://72.60.61.34";

async function parseOrThrow(res: Response) {
  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  }

  const text = await res.text();
  throw new Error(`${res.status} ${res.statusText} - ${text}`);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
  });
  return (await parseOrThrow(res)) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await parseOrThrow(res)) as T;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await parseOrThrow(res)) as T;
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
  });
  await parseOrThrow(res);
}

export type UploadImagemResponse = {
  filename: string;
  url: string;
};

export async function apiUploadImagem(file: File): Promise<UploadImagemResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/conteudos/upload-imagem`, {
    method: "POST",
    body: formData,
  });

  return (await parseOrThrow(res)) as UploadImagemResponse;
}