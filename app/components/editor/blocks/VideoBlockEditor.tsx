"use client";

import type { VideoContent } from "@/src/lib/templates";

type VideoBlockEditorProps = {
  content: VideoContent;
  onUpdate: (content: VideoContent) => void;
};

export default function VideoBlockEditor({
  content,
  onUpdate,
}: VideoBlockEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground">
          Video-URL
        </label>
        <input
          type="url"
          value={content?.url || ""}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="https://example.com/video.mp4"
          className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Syötä suora linkki videotiedostoon (.mp4)
        </p>
      </div>
    </div>
  );
}
