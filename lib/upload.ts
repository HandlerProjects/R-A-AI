export async function uploadPhoto(file: File, folder: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    const { url } = await res.json();
    return url ?? null;
  } catch {
    return null;
  }
}
