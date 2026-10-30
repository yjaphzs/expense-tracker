import { describe, expect, it } from "vitest";

import { decodeFrames, encodeFrames, parseFrame, QR_CHUNK_SIZE } from "./qr-frames";

describe("qr frames", () => {
  it("round-trips a small payload in one frame", () => {
    const payload = { transactions: [], wallets: [{ id: "cash" }], budgets: [{ id: "all", amount: 5 }] };
    const { frames } = encodeFrames(payload);
    expect(frames).toHaveLength(1);
    const frame = parseFrame(frames[0])!;
    expect(decodeFrames(new Map([[1, frame.data]]), 1)).toEqual(payload);
  });

  it("splits a large payload and reassembles it in any scan order", () => {
    const payload = { transactions: Array.from({ length: 600 }, (_, i) => ({ id: `t${i}-${Math.random()}`, amount: i })) };
    const { frames, compressedLength } = encodeFrames(payload);
    expect(frames.length).toBe(Math.ceil(compressedLength / QR_CHUNK_SIZE));
    expect(frames.length).toBeGreaterThan(1);
    const scanned = new Map<number, string>();
    for (const text of [...frames].reverse()) {
      const frame = parseFrame(text)!;
      scanned.set(frame.index, frame.data);
    }
    expect(decodeFrames(scanned, frames.length)).toEqual(payload);
  });

  it("rejects foreign codes and incomplete sets", () => {
    expect(parseFrame("https://example.com")).toBeNull();
    expect(parseFrame("ET:3/2:abc")).toBeNull();
    expect(() => decodeFrames(new Map([[1, "x"]]), 2)).toThrow(/2 of 2/);
  });
});
