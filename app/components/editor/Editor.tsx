"use client";

import { useState } from "react";
import { updatePageContent } from "@/app/actions/save-page";
import { TemplateConfig, getTemplateById } from "@/src/lib/templates";
import { normalizeContent, mergeTemplateContent } from "./utils/contentUtils";
import {
  updateHeroField,
  updateThemeField,
  addFeature,
  removeFeature,
  updateFeature,
  addTestimonial,
  removeTestimonial,
  updateTestimonial,
  addFaq,
  removeFaq,
  updateFaq,
  updateAboutField,
  updateVideoUrl,
} from "./utils/contentUpdaters";
import { useToast } from "@/app/components/ui/ToastContainer";
import EditorHeader from "./EditorHeader";
import StatusMessages from "./StatusMessages";
import TemplateSelector from "./TemplateSelector";
import HeroFields from "./fields/HeroFields";
import VideoFields from "./fields/VideoFields";
import ThemeFields from "./fields/ThemeFields";
import AboutFields from "./fields/AboutFields";
import FeaturesEditor from "./fields/FeaturesEditor";
import TestimonialsEditor from "./fields/TestimonialsEditor";
import FaqEditor from "./fields/FaqEditor";
import SaveButton from "./SaveButton";
import EditorPreview from "./EditorPreview";
import PublishedToggle from "./PublishedToggle";

interface EditorProps {
  siteId: string;
  pageId: string | null;
  siteSubdomain: string;
  initialContent: TemplateConfig | any; // Tuki vanhalle muodolle
  initialPublished?: boolean;
}

export default function Editor({
  siteId,
  pageId,
  siteSubdomain,
  initialContent,
  initialPublished = false,
}: EditorProps) {
  const { showToast, showConfirm } = useToast();
  const [content, setContent] = useState<TemplateConfig>(
    normalizeContent(initialContent),
  );
  const [published, setPublished] = useState<boolean>(initialPublished);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updatePageContent(siteId, content, published);
      if (result?.error) {
        setError(result.error);
        showToast(result.error, "error");
      } else {
        setSuccess(true);
        showToast("Muutokset tallennettu onnistuneesti!", "success");
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      const errorMessage = "Tallennus epäonnistui. Yritä uudelleen.";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplateChange = async (newTemplateId: string) => {
    if (newTemplateId === content.templateId) return;

    const confirmed = await showConfirm(
      "Olet vaihtamassa templatea. Tämä voi muuttaa sivun rakennetta ja poistaa osan datasta. Haluatko jatkaa?",
      () => {
        // Tyhjä callback - tehdään toiminnot confirmed-tarkistuksen jälkeen
      },
    );

    if (confirmed) {
      const mergedContent = mergeTemplateContent(content, newTemplateId);
      if (mergedContent) {
        setContent(mergedContent);
        showToast("Template vaihdettu onnistuneesti!", "success");
      }
    }
  };

  const currentTemplate = getTemplateById(content.templateId || "saas-modern");
  const supportsFeatures =
    currentTemplate?.defaultContent.features !== undefined;
  const supportsVideo = currentTemplate?.id === "vsl";
  const supportsAbout = currentTemplate?.id === "personal";
  const supportsTestimonials = currentTemplate?.id === "personal";
  const supportsFaq = currentTemplate?.defaultContent.faq !== undefined;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Form (40%) */}
      <div className="w-2/5 overflow-y-auto border-r border-gray-200 bg-white p-6">
        <EditorHeader siteId={siteId} siteSubdomain={siteSubdomain} />
        <StatusMessages error={error} success={success} />

        <div className="space-y-6">
          <TemplateSelector
            currentTemplateId={content.templateId || "saas-modern"}
            onTemplateChange={handleTemplateChange}
          />

          <PublishedToggle
            published={published}
            onToggle={setPublished}
            isSaving={isSaving}
          />

          <HeroFields
            hero={content.hero}
            onUpdate={(field, value) =>
              setContent(updateHeroField(field, value))
            }
          />

          {supportsVideo && (
            <VideoFields
              videoUrl={content.videoUrl}
              onUpdate={(value) => setContent(updateVideoUrl(value))}
            />
          )}

          {supportsFeatures && (
            <FeaturesEditor
              features={content.features}
              onAdd={() => setContent(addFeature())}
              onRemove={(index) => setContent(removeFeature(index))}
              onUpdate={(index, field, value) =>
                setContent(updateFeature(index, field, value))
              }
            />
          )}

          {supportsAbout && (
            <AboutFields
              about={content.about}
              onUpdate={(field, value) =>
                setContent(updateAboutField(field, value))
              }
            />
          )}

          {supportsTestimonials && (
            <TestimonialsEditor
              testimonials={content.testimonials}
              onAdd={() => setContent(addTestimonial())}
              onRemove={(index) => setContent(removeTestimonial(index))}
              onUpdate={(index, field, value) =>
                setContent(updateTestimonial(index, field, value))
              }
            />
          )}

          {supportsFaq && (
            <FaqEditor
              faq={content.faq}
              onAdd={() => setContent(addFaq())}
              onRemove={(index) => setContent(removeFaq(index))}
              onUpdate={(index, field, value) =>
                setContent(updateFaq(index, field, value))
              }
            />
          )}

          <ThemeFields
            primaryColor={content.theme?.primaryColor}
            onUpdate={(value) =>
              setContent(updateThemeField("primaryColor", value))
            }
          />

          <SaveButton isSaving={isSaving} onSave={handleSave} />
        </div>
      </div>

      {/* Right Side - Preview (60%) */}
      <EditorPreview content={content} />
    </div>
  );
}
