const PANEL_URL = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

export type PteroFileEntry = {
  name: string;
  mode: string;
  modeBits: string;
  size: number;
  isFile: boolean;
  isSymlink: boolean;
  mimetype: string;
  createdAt: string;
  modifiedAt: string;
};

export type DirectoryListingResponse = {
  data: PteroFileEntry[];
};

function assertConfig(apiKey: string | undefined) {
  if (!PANEL_URL) {
    throw new Error("NEXT_PUBLIC_PTERODACTYL_URL environment variable is not set");
  }

  if (!apiKey) {
    throw new Error("Pterodactyl API key is required");
  }
}

function buildHeaders(apiKey: string) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
  } satisfies HeadersInit;
}

function ensureLeadingSlash(path: string) {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }
  return path;
}

export async function listDirectory(serverId: string, directory: string, apiKey?: string): Promise<DirectoryListingResponse> {
  assertConfig(apiKey);
  const safeDirectory = encodeURIComponent(directory || "/");
  const response = await fetch(`${PANEL_URL}/api/client/servers/${serverId}/files/list?directory=${safeDirectory}`, {
    headers: buildHeaders(apiKey!),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to list directory: ${response.status}`);
  }

  const payload = await response.json();
  const data = Array.isArray(payload?.data)
    ? payload.data.map((entry: any) => {
        const attr = entry?.attributes ?? {};
        return {
          name: String(attr.name ?? ""),
          mode: String(attr.mode ?? ""),
          modeBits: String(attr.mode_bits ?? ""),
          size: Number(attr.size ?? 0),
          isFile: Boolean(attr.is_file),
          isSymlink: Boolean(attr.is_symlink),
          mimetype: String(attr.mimetype ?? ""),
          createdAt: String(attr.created_at ?? ""),
          modifiedAt: String(attr.modified_at ?? ""),
        } as PteroFileEntry;
      })
    : [];

  return { data };
}

export async function readFile(serverId: string, filePath: string, apiKey?: string): Promise<string> {
  assertConfig(apiKey);
  const safePath = encodeURIComponent(ensureLeadingSlash(filePath));
  const response = await fetch(`${PANEL_URL}/api/client/servers/${serverId}/files/contents?file=${safePath}`, {
    headers: {
      ...buildHeaders(apiKey!),
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to read file: ${response.status}`);
  }

  return response.text();
}

export async function writeFile(serverId: string, filePath: string, content: string, apiKey?: string): Promise<void> {
  assertConfig(apiKey);
  const safePath = encodeURIComponent(ensureLeadingSlash(filePath));
  const response = await fetch(`${PANEL_URL}/api/client/servers/${serverId}/files/write?file=${safePath}`, {
    method: "POST",
    headers: {
      ...buildHeaders(apiKey!),
      "Content-Type": "text/plain",
    },
    body: content,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to write file: ${response.status}`);
  }
}

export async function getDownloadUrl(serverId: string, filePath: string, apiKey?: string): Promise<string> {
  assertConfig(apiKey);
  const safePath = encodeURIComponent(ensureLeadingSlash(filePath));
  const response = await fetch(`${PANEL_URL}/api/client/servers/${serverId}/files/download?file=${safePath}`, {
    headers: buildHeaders(apiKey!),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to request download: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    const url = data?.attributes?.url;
    if (!url) {
      throw new Error("Download URL missing in response");
    }
    return url;
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export type UploadProgressHandler = (percent: number) => void;

export async function uploadFiles(
  serverId: string,
  directory: string,
  files: FileList | File[],
  apiKey?: string,
  onProgress?: UploadProgressHandler,
): Promise<void> {
  assertConfig(apiKey);
  const targetDirectory = encodeURIComponent(directory || "/");
  const signedResponse = await fetch(
    `${PANEL_URL}/api/client/servers/${serverId}/files/upload?directory=${targetDirectory}`,
    {
      headers: buildHeaders(apiKey!),
    },
  );

  if (!signedResponse.ok) {
    const message = await signedResponse.text();
    throw new Error(message || `Failed to get upload URL: ${signedResponse.status}`);
  }

  const signedData = await signedResponse.json();
  const signedUrl = signedData?.attributes?.url as string | undefined;
  if (!signedUrl) {
    throw new Error("Signed upload URL missing in response");
  }

  const list = Array.isArray(files) ? files : Array.from(files);
  const formData = new FormData();
  list.forEach((file) => formData.append("files", file));
  formData.append("directory", directory || "/");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", signedUrl);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.onabort = () => reject(new Error("Upload aborted"));

    xhr.send(formData);
  });
}

function normalizeDirectoryRoot(directory: string) {
  if (!directory || directory === "/") {
    return "/";
  }

  const ensured = ensureLeadingSlash(directory);
  return ensured.endsWith("/") ? ensured : `${ensured}/`;
}

export async function renameEntry(
  serverId: string,
  directory: string,
  from: string,
  to: string,
  apiKey?: string,
): Promise<void> {
  assertConfig(apiKey);
  const response = await fetch(`${PANEL_URL}/api/client/servers/${serverId}/files/rename`, {
    method: "POST",
    headers: {
      ...buildHeaders(apiKey!),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      root: normalizeDirectoryRoot(directory),
      files: [{ from, to }],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to rename entry: ${response.status}`);
  }
}

export async function deleteEntry(serverId: string, directory: string, name: string, apiKey?: string): Promise<void> {
  assertConfig(apiKey);
  const response = await fetch(`${PANEL_URL}/api/client/servers/${serverId}/files/delete`, {
    method: "POST",
    headers: {
      ...buildHeaders(apiKey!),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      root: normalizeDirectoryRoot(directory),
      files: [name],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to delete entry: ${response.status}`);
  }
}
