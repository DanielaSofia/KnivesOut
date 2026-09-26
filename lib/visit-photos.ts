import { mkdir, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const maxPhotos = 5;
const maxPhotoSize = 8 * 1024 * 1024;

type PreparedPhoto = {
  bytes: Buffer;
  extension: "gif" | "jpg" | "png" | "webp";
};

function getVisitPhotoDirectory(visitId: number) {
  return path.join(process.cwd(), "public", "uploads", "visits", String(visitId));
}

function detectPhotoExtension(bytes: Buffer): PreparedPhoto["extension"] | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.length >= 6 && /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString("ascii"))) return "gif";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  return null;
}

export async function prepareVisitPhotos(files: File[]) {
  if (files.length > maxPhotos) {
    return { error: `Pode adicionar até ${maxPhotos} fotografias.` };
  }

  const photos: PreparedPhoto[] = [];
  for (const file of files) {
    if (file.size > maxPhotoSize) {
      return { error: "Cada fotografia deve ter no máximo 8 MB." };
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = detectPhotoExtension(bytes);
    if (!extension) {
      return { error: "As fotografias devem estar em JPEG, PNG, WebP ou GIF." };
    }
    photos.push({ bytes, extension });
  }

  return { photos };
}

export async function storeVisitPhotos(visitId: number, photos: PreparedPhoto[]) {
  if (photos.length === 0) return [];

  const directory = getVisitPhotoDirectory(visitId);
  await mkdir(directory, { recursive: true });
  const filenames = photos.map(({ extension }) => `${randomUUID()}.${extension}`);
  try {
    await Promise.all(
      photos.map(({ bytes }, index) => writeFile(path.join(directory, filenames[index]), bytes)),
    );
  } catch (error) {
    await Promise.all(
      filenames.map((filename) => unlink(path.join(directory, filename)).catch(() => undefined)),
    );
    throw error;
  }
  return filenames;
}

export async function listVisitPhotos(visitId: number) {
  const directory = getVisitPhotoDirectory(visitId);
  const filenames = await readdir(directory).catch(() => []);
  return filenames
    .filter((filename) => /^[0-9a-f-]{36}\.(gif|jpg|png|webp)$/.test(filename))
    .sort()
    .map((filename) => `/uploads/visits/${visitId}/${filename}`);
}

export async function removeVisitPhotos(visitId: number, filenames?: string[]) {
  const directory = getVisitPhotoDirectory(visitId);
  if (!filenames) {
    await rm(directory, { recursive: true, force: true });
    return;
  }

  await Promise.all(
    filenames
      .filter((filename) => /^[0-9a-f-]{36}\.(gif|jpg|png|webp)$/.test(filename))
      .map((filename) => unlink(path.join(directory, filename)).catch(() => undefined)),
  );
}