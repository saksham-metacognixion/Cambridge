/*
 * File attachment rules (bug 093), shared by the browser (src/scripts/forms.ts), the build (src/lib/forms.ts) and the form
 * function (functions/api/forms/[form].ts), so the three never disagree. The values themselves live in src/data/forms.json
 * `attachments` (PROVISIONAL: types and size are not confirmed by the client, docs/open-decisions.md F093).
 * Nothing here stores a file: the function reads it into memory, attaches it to the one email and drops it.
 */
export interface AttachmentRules {
  /** Largest accepted file, bytes. Must stay under the host's request body limit (Vercel functions: 4.5 MB). */
  maxBytes: number;
  /** Accepted extension (lower case, no dot) -> the MIME type the email declares (never the browser's claim). */
  types: Record<string, string>;
}

export type FileError = "file_type" | "file_size" | "file_invalid";

/** Lower-case extension of a file name ("" when none). */
export const extOf = (name: string) =>
  /\.([a-z0-9]{1,8})$/i.exec(name.trim())?.[1].toLowerCase() ?? "";

/** Name + size check (browser and server). Content is checked separately on the server (sniff). */
export function checkFile(
  name: string,
  size: number,
  rules: AttachmentRules,
): FileError | undefined {
  if (!Object.hasOwn(rules.types, extOf(name))) return "file_type";
  if (size > rules.maxBytes) return "file_size";
  if (size <= 0) return "file_invalid";
  return undefined;
}

/**
 * Does the content look like its extension? The first bytes ("magic numbers") of each accepted family; a renamed .exe or a
 * text file called report.pdf fails. Unknown extensions fail (only types with a signature here may be configured).
 */
export function sniff(ext: string, head: Uint8Array): boolean {
  const starts = (...sig: number[]) => sig.every((b, i) => head[i] === b);
  switch (ext) {
    case "pdf":
      return starts(0x25, 0x50, 0x44, 0x46, 0x2d); // %PDF-
    case "jpg":
    case "jpeg":
      return starts(0xff, 0xd8, 0xff);
    case "png":
      return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case "doc":
      return starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1); // OLE compound file
    case "docx":
      return starts(0x50, 0x4b, 0x03, 0x04); // ZIP container
    default:
      return false;
  }
}

/**
 * File name safe for an email header and any mail client: no path, no control or reserved characters, no leading dots,
 * at most 100 characters, and the (validated, lower-case) extension at the end. Letters of any script are kept (Arabic names).
 */
export function safeName(name: string, ext: string): string {
  const base = (name.split(/[\\/]/).pop() ?? "")
    .replace(/\.[^.]*$/, "")
    .replace(/[\u0000-\u001f\u007f<>:"|?*;=%`$]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[.\s-]+/, "")
    .trim();
  const short = [...base]
    .slice(0, 100 - ext.length - 1)
    .join("")
    .trim();
  return `${short || "attachment"}.${ext}`;
}

/** "PDF, JPG, PNG, DOC or DOCX" (jpeg folded into JPG), with the locale's "or". */
export function typeList(rules: AttachmentRules, or: string): string {
  const names = [
    ...new Set(
      Object.keys(rules.types).map((e) =>
        e === "jpeg" ? "JPG" : e.toUpperCase(),
      ),
    ),
  ];
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} ${or} ${names.at(-1)}`
    : (names[0] ?? "");
}

/** "4 MB" */
export const sizeLabel = (bytes: number) =>
  `${+(bytes / 1048576).toFixed(1)} MB`;

/** Value of the HTML accept attribute: ".pdf,.jpg,...". */
export const acceptAttr = (rules: AttachmentRules) =>
  Object.keys(rules.types)
    .map((e) => `.${e}`)
    .join(",");
