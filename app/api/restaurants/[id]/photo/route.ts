import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const photoTypes = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type PhotoRouteProps = {
  params: Promise<{ id: string }>;
};

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
      "Cache-Control": "public, max-age=3600",
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

  const formData = await request.formData();
  const photo = formData.get("photo");

  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "Escolha uma fotografia." }, { status: 400 });
  }

  const extension = photoTypes[photo.type as keyof typeof photoTypes];

  if (!extension) {
    return NextResponse.json(
      { error: "A fotografia deve estar em JPEG, PNG, WebP ou GIF." },
      { status: 400 },
    );
  }

  if (photo.size > 8 * 1024 * 1024) {
    return NextResponse.json(
      { error: "A fotografia deve ter no máximo 8 MB." },
      { status: 400 },
    );
  }

  const directory = getPhotoDirectory();
  await mkdir(directory, { recursive: true });

  const existingPhoto = await findPhoto(restaurantId);

  if (existingPhoto) {
    await unlink(existingPhoto);
  }

  await writeFile(
    getPhotoPath(restaurantId, extension),
    Buffer.from(await photo.arrayBuffer()),
  );

  return NextResponse.json({ uploaded: true });
}