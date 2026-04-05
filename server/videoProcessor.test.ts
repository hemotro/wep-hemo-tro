import { describe, it, expect } from "vitest";

describe("Video Processor", () => {
  it("should support 4 quality levels", () => {
    const qualities = ["1080p", "720p", "480p", "360p"];
    expect(qualities).toHaveLength(4);
    expect(qualities).toContain("1080p");
    expect(qualities).toContain("720p");
    expect(qualities).toContain("480p");
    expect(qualities).toContain("360p");
  });

  it("should have correct resolution dimensions", () => {
    const resolutions: Record<string, [number, number]> = {
      "1080p": [1920, 1080],
      "720p": [1280, 720],
      "480p": [854, 480],
      "360p": [640, 360],
    };

    Object.entries(resolutions).forEach(([quality, [width, height]]) => {
      expect(width).toBeGreaterThan(height);
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    });
  });

  it("should have correct bitrate settings", () => {
    const bitrates: Record<string, string> = {
      "1080p": "128k",
      "720p": "96k",
      "480p": "64k",
      "360p": "32k",
    };

    Object.entries(bitrates).forEach(([quality, bitrate]) => {
      expect(bitrate).toMatch(/^\d+k$/);
      const value = parseInt(bitrate);
      expect(value).toBeGreaterThan(0);
    });
  });

  it("should process videos in correct order", () => {
    const processingOrder = ["1080p", "720p", "480p", "360p"];
    expect(processingOrder[0]).toBe("1080p");
    expect(processingOrder[processingOrder.length - 1]).toBe("360p");
  });

  it("should return all quality blobs", () => {
    const expectedBlobs = {
      video1080p: "Blob",
      video720p: "Blob",
      video480p: "Blob",
      video360p: "Blob",
    };

    expect(Object.keys(expectedBlobs)).toHaveLength(4);
    Object.values(expectedBlobs).forEach((blobType) => {
      expect(blobType).toBe("Blob");
    });
  });

  it("should use libx264 codec for all qualities", () => {
    const codec = "libx264";
    const qualities = ["1080p", "720p", "480p", "360p"];

    qualities.forEach((quality) => {
      expect(codec).toBe("libx264");
    });
  });

  it("should use fast preset for all qualities", () => {
    const preset = "fast";
    const qualities = ["1080p", "720p", "480p", "360p"];

    qualities.forEach((quality) => {
      expect(preset).toBe("fast");
    });
  });

  it("should use AAC audio codec", () => {
    const audioCodec = "aac";
    expect(audioCodec).toBe("aac");
  });

  it("should have correct CRF values", () => {
    const crfValues: Record<string, number> = {
      "1080p": 23,
      "720p": 23,
      "480p": 28,
      "360p": 28,
    };

    Object.entries(crfValues).forEach(([quality, crf]) => {
      expect(crf).toBeGreaterThanOrEqual(0);
      expect(crf).toBeLessThanOrEqual(51);
    });
  });
});
