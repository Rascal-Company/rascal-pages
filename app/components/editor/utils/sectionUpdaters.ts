import type {
  TemplateConfig,
  SectionType,
  SectionContentMap,
} from "@/src/lib/templates";
import type { SectionId } from "@/src/lib/types";
import { createSection, getDefaultSectionContent } from "./contentUtils";

type ContentUpdater = (prev: TemplateConfig) => TemplateConfig;

/**
 * Reorder sections by moving a section from one position to another
 */
export function reorderSections(
  activeId: SectionId,
  overId: SectionId,
): ContentUpdater {
  return (prev) => {
    const oldIndex = prev.sections.findIndex((s) => s.id === activeId);
    const newIndex = prev.sections.findIndex((s) => s.id === overId);
    if (oldIndex === -1 || newIndex === -1) return prev;

    const newSections = [...prev.sections];
    const [removed] = newSections.splice(oldIndex, 1);
    newSections.splice(newIndex, 0, removed);

    return { ...prev, sections: newSections };
  };
}

/**
 * Update a section's content
 */
export function updateSectionContent<T extends SectionType>(
  sectionId: SectionId,
  content: SectionContentMap[T],
): ContentUpdater {
  return (prev) => ({
    ...prev,
    sections: prev.sections.map((s) =>
      s.id === sectionId ? { ...s, content } : s,
    ),
  });
}

/**
 * Toggle a section's visibility
 */
export function toggleSectionVisibility(sectionId: SectionId): ContentUpdater {
  return (prev) => ({
    ...prev,
    sections: prev.sections.map((s) =>
      s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s,
    ),
  });
}

/**
 * Add a new section
 */
export function addSection(
  type: SectionType,
  afterId?: SectionId,
): ContentUpdater {
  return (prev) => {
    const defaultContent = getDefaultSectionContent(type);
    const newSection = createSection(type, defaultContent);
    const sections = [...prev.sections];

    if (afterId) {
      const index = sections.findIndex((s) => s.id === afterId);
      if (index !== -1) {
        sections.splice(index + 1, 0, newSection);
      } else {
        sections.push(newSection);
      }
    } else {
      const footerIndex = sections.findIndex((s) => s.type === "footer");
      if (footerIndex !== -1) {
        sections.splice(footerIndex, 0, newSection);
      } else {
        sections.push(newSection);
      }
    }

    return { ...prev, sections };
  };
}

/**
 * Remove a section
 */
export function removeSection(sectionId: SectionId): ContentUpdater {
  return (prev) => ({
    ...prev,
    sections: prev.sections.filter((s) => s.id !== sectionId),
  });
}

/**
 * Duplicate a section
 */
export function duplicateSection(sectionId: SectionId): ContentUpdater {
  return (prev) => {
    const sectionIndex = prev.sections.findIndex((s) => s.id === sectionId);
    if (sectionIndex === -1) return prev;

    const original = prev.sections[sectionIndex];
    const duplicate = createSection(
      original.type,
      JSON.parse(JSON.stringify(original.content)),
      original.isVisible,
    );

    const sections = [...prev.sections];
    sections.splice(sectionIndex + 1, 0, duplicate);

    return { ...prev, sections };
  };
}

/**
 * Update theme color
 */
export function updateThemeColor(color: string): ContentUpdater {
  return (prev) => ({
    ...prev,
    theme: { ...prev.theme, primaryColor: color },
  });
}

/**
 * Update theme font (heading or body)
 */
export function updateThemeFont(
  field: "headingFont" | "bodyFont",
  fontName: string,
): ContentUpdater {
  return (prev) => ({
    ...prev,
    theme: { ...prev.theme, [field]: fontName || undefined },
  });
}
