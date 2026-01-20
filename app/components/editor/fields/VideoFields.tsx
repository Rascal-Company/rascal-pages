'use client';

interface VideoFieldsProps {
  videoUrl?: string;
  onUpdate: (value: string) => void;
}

export default function VideoFields({ videoUrl, onUpdate }: VideoFieldsProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Video</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Video-URL
        </label>
        <input
          type="url"
          value={videoUrl || ''}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="https://example.com/video.mp4"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
      </div>
    </div>
  );
}
