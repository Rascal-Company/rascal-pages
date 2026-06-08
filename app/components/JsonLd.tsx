type JsonLdProps = {
  data: Record<string, unknown>;
};

/**
 * Renders a JSON-LD structured data script tag.
 * The payload comes from trusted server-side builders in `src/lib/seo.ts`.
 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
