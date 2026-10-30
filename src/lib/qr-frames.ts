import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

/**
 * QR transfer framing. The state is JSON, lz-string compressed, then split
 * into frames small enough for one QR code each:
 *   one frame:  "ET1:<data>"
 *   several:    "ET:<index>/<total>:<data>" (index is 1-based)
 */

// A QR code holds about 2,900 bytes at the lowest error correction; stay well under.
export const QR_CHUNK_SIZE = 1800;

export interface EncodedFrames {
  frames: string[];
  compressedLength: number;
}

export function encodeFrames(payload: unknown): EncodedFrames {
  const compressed = compressToEncodedURIComponent(JSON.stringify(payload));
  const chunks: string[] = [];
  for (let i = 0; i < compressed.length; i += QR_CHUNK_SIZE) chunks.push(compressed.slice(i, i + QR_CHUNK_SIZE));
  const frames = chunks.length === 1 ? [`ET1:${chunks[0]}`] : chunks.map((chunk, i) => `ET:${i + 1}/${chunks.length}:${chunk}`);
  return { frames, compressedLength: compressed.length };
}

export type ParsedFrame = { index: number; total: number; data: string };

/** A scanned frame, or null when the code isn't one of ours. */
export function parseFrame(text: string): ParsedFrame | null {
  if (text.startsWith("ET1:")) return { index: 1, total: 1, data: text.slice(4) };
  const match = /^ET:(\d+)\/(\d+):(.+)$/.exec(text);
  if (!match) return null;
  const index = Number(match[1]);
  const total = Number(match[2]);
  return index >= 1 && index <= total ? { index, total, data: match[3] } : null;
}

/** Joins frames 1…total and decodes the payload. Throws if anything is missing or corrupt. */
export function decodeFrames(frames: Map<number, string>, total: number): unknown {
  let compressed = "";
  for (let i = 1; i <= total; i++) {
    const frame = frames.get(i);
    if (frame === undefined) throw new Error(`Missing QR code ${i} of ${total}`);
    compressed += frame;
  }
  const json = decompressFromEncodedURIComponent(compressed);
  if (!json) throw new Error("Couldn't decode the QR data");
  return JSON.parse(json);
}
