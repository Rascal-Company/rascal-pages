import type { CSSProperties } from "react";
import type {
  AboutContent,
  BlogContent,
  FaqItem,
  FeatureItem,
  FormContent,
  HeroContent,
  TemplateConfig,
  TestimonialItem,
  VideoContent,
} from "@/lib/templates";
import type { Post } from "@/lib/posts";
import { buildGoogleFontsUrl } from "@/lib/fonts";
import HeroBlock from "@/components/blocks/HeroBlock";
import AboutBlock from "@/components/blocks/AboutBlock";
import BlogListBlock from "@/components/blocks/BlogListBlock";
import FooterBlock from "@/components/blocks/FooterBlock";
import FeaturesBlock from "@/components/blocks/FeaturesBlock";
import FaqBlock from "@/components/blocks/FaqBlock";
import TestimonialsBlock from "@/components/blocks/TestimonialsBlock";
import LogosBlock from "@/components/blocks/LogosBlock";
import VideoBlock from "@/components/blocks/VideoBlock";
import FormBlock from "@/components/blocks/FormBlock";

/**
 * Maps a TemplateConfig's sections to rendered blocks. Server component — no
 * client JS, no analytics. Currently covers the personal-brand block set
 * (hero / about / blog / footer); other section types are skipped until their
 * blocks are ported.
 */
export default function SiteRenderer({
  template,
  posts,
  siteName,
}: {
  template: TemplateConfig;
  posts: Post[];
  siteName: string;
}) {
  const { sections, theme } = template;
  const fontsUrl = buildGoogleFontsUrl(theme.headingFont, theme.bodyFont);

  const fontStyles: CSSProperties = {
    ...(theme.headingFont && {
      ["--heading-font" as string]: `'${theme.headingFont}', sans-serif`,
    }),
    ...(theme.bodyFont && {
      ["--body-font" as string]: `'${theme.bodyFont}', sans-serif`,
    }),
  };

  return (
    <div className="min-h-screen bg-white" style={fontStyles}>
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
      {sections
        .filter((section) => section.isVisible)
        .map((section) => {
          switch (section.type) {
            case "hero":
              return (
                <HeroBlock
                  key={section.id}
                  content={section.content as HeroContent}
                  theme={theme}
                />
              );
            case "about":
              return (
                <AboutBlock
                  key={section.id}
                  content={section.content as AboutContent}
                />
              );
            case "blog":
              return (
                <BlogListBlock
                  key={section.id}
                  content={section.content as BlogContent}
                  posts={posts}
                  theme={theme}
                />
              );
            case "footer":
              return <FooterBlock key={section.id} siteName={siteName} />;
            case "features":
              return (
                <FeaturesBlock
                  key={section.id}
                  content={section.content as FeatureItem[]}
                />
              );
            case "faq":
              return (
                <FaqBlock
                  key={section.id}
                  content={section.content as FaqItem[]}
                />
              );
            case "testimonials":
              return (
                <TestimonialsBlock
                  key={section.id}
                  content={section.content as TestimonialItem[]}
                  theme={theme}
                />
              );
            case "video":
              return (
                <VideoBlock
                  key={section.id}
                  content={section.content as VideoContent}
                />
              );
            case "form":
              return (
                <FormBlock
                  key={section.id}
                  content={section.content as FormContent}
                  theme={theme}
                />
              );
            case "logos":
              return <LogosBlock key={section.id} />;
            default:
              return null;
          }
        })}
    </div>
  );
}
