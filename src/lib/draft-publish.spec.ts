import { describe, expect, it } from "vitest";
import {
  editableContent,
  pageHasUnpublishedChanges,
  variantHasUnpublishedChanges,
} from "./draft-publish";

describe("pageHasUnpublishedChanges", () => {
  it("is false for an unpublished page", () => {
    expect(pageHasUnpublishedChanges({ published: false, content: { a: 1 }, draft_content: { a: 2 } })).toBe(false);
  });
  it("is false without a draft", () => {
    expect(pageHasUnpublishedChanges({ published: true, content: { a: 1 }, draft_content: null })).toBe(false);
  });
  it("is false when the draft equals live", () => {
    expect(pageHasUnpublishedChanges({ published: true, content: { a: 1 }, draft_content: { a: 1 } })).toBe(false);
  });
  it("is true when a published page has a differing draft", () => {
    expect(pageHasUnpublishedChanges({ published: true, content: { a: 1 }, draft_content: { a: 2 } })).toBe(true);
  });
});

describe("editableContent", () => {
  it("prefers the draft", () => {
    expect(editableContent({ content: "live", draft_content: "draft" })).toBe("draft");
  });
  it("falls back to live content", () => {
    expect(editableContent({ content: "live", draft_content: null })).toBe("live");
  });
});

describe("variantHasUnpublishedChanges", () => {
  const change = [{ selector: "h1", type: "text", value: "Hei" }];
  it("is false for an unpublished variant", () => {
    expect(variantHasUnpublishedChanges({ active: false, changes: [], draft_changes: change })).toBe(false);
  });
  it("is false when draft equals live", () => {
    expect(variantHasUnpublishedChanges({ active: true, changes: change, draft_changes: change })).toBe(false);
  });
  it("is true when a live variant has a differing draft", () => {
    expect(variantHasUnpublishedChanges({ active: true, changes: [], draft_changes: change })).toBe(true);
  });
  it("treats null as empty", () => {
    expect(variantHasUnpublishedChanges({ active: true, changes: null, draft_changes: [] })).toBe(false);
  });
});
