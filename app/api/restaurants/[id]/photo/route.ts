import {
  mkdir,
  readFile,
  readdir,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";

const photoTypes = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type PhotoRouteProps = {
  params: Promise<{ id: string }>;
};

const photoUploadLocks = new Map<number, Promise<void>>();

function getPhotoDirectory() {
  return path.join(process.cwd(), "public", "uploads", "restaurants");
}

function getPhotoPath(id: number, extension: string) {
  return path.join(getPhotoDirectory(), `${id}.${extension}`);
}

async function findPhoto(id: number) {
  const directory = getPhotoDirectory();
  const files = await readdir(directory).catch(() => []);
  const file = files.find((entry) =>
    new RegExp(`^${id}\\.(gif|jpg|png|webp)$`).test(entry),
  );

  return file ? path.join(directory, file) : null;
}

function detectPhotoExtension(bytes: Buffer) {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }

  if (bytes.length >= 6 && /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString("ascii"))) {
    return "gif";
  }

  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }

  return null;
}

async function withPhotoUploadLock<T>(
  restaurantId: number,
  operation: () => Promise<T>,
) {
  const previous = photoUploadLocks.get(restaurantId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  photoUploadLocks.set(restaurantId, current);
  await previous;

  try {
    return await operation();
  } finally {
    release();
    if (photoUploadLocks.get(restaurantId) === current) {
      photoUploadLocks.delete(restaurantId);
    }
  }
}

export async function GET(
  _request: NextRequest,
  { params }: PhotoRouteProps,
) {
  const restaurantId = Number((await params).id);

  if (!Number.isInteger(restaurantId)) {
    return NextResponse.json({ error: "Restaurante inválido." }, { status: 400 });
  }

  const photoPath = await findPhoto(restaurantId);

  if (!photoPath) {
    return new NextResponse(null, { status: 404 });
  }

  const file = await readFile(photoPath);
  const extension = path.extname(photoPath).slice(1);
  const contentType = extension === "jpg" ? "image/jpeg" : `image/${extension}`;

  return new NextResponse(file, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Type": contentType,
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: PhotoRouteProps,
) {
  const restaurantId = Number((await params).id);

  if (!Number.isInteger(restaurantId)) {
    return NextResponse.json({ error: "Restaurante inválido." }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });

  if (!restaurant) {
    return NextResponse.json(
      { error: "Restaurante não encontrado." },
      { status: 404 },
    );
  }

  const formData = await request.formData();
  const photo = formData.get("photo");

  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "Escolha uma fotografia." }, { status: 400 });
  }

  if (photo.size > 8 * 1024 * 1024) {
    return NextResponse.json(
      { error: "A fotografia deve ter no máximo 8 MB." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await photo.arrayBuffer());
  const extension = detectPhotoExtension(bytes);

  if (!extension || !(extension in photoTypes)) {
    return NextResponse.json(
      { error: "A fotografia deve estar em JPEG, PNG, WebP ou GIF." },
      { status: 400 },
    );
  }

  await withPhotoUploadLock(restaurantId, async () => {
    const directory = getPhotoDirectory();
    await mkdir(directory, { recursive: true });

    const temporaryPath = path.join(
      directory,
      `.${restaurantId}.${randomUUID()}.${extension}.tmp`,
    );
    const finalPath = getPhotoPath(restaurantId, extension);

    try {
      await writeFile(temporaryPath, bytes);
      await rename(temporaryPath, finalPath);

      const files = await readdir(directory);
      await Promise.all(
        files
          .filter(
            (file) =>
              new RegExp(`^${restaurantId}\\.(gif|jpg|png|webp)$`).test(file) &&
              path.join(directory, file) !== finalPath,
          )
          .map((file) => unlink(path.join(directory, file))),
      );
    } finally {
      await unlink(temporaryPath).catch(() => undefined);
    }
  });

  return NextResponse.json({ uploaded: true });
}