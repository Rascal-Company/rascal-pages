"use client";

interface VideoFieldsProps {
  videoUrl?: string;
  onUpdate: (value: string) => void;
}

export default function VideoFields({ videoUrl, onUpdate }: VideoFieldsProps) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Video</h2>
      <div>
        <label className="block text-sm font-medium text-foreground">
          Video-URL
        </label>
        <input
          type="url"
          value={videoUrl || ""}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="https://example.com/video.mp4"
          className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
        />
      </div>
    </div>
  );
}
