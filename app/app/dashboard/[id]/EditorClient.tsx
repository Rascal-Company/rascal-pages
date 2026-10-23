"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type EditorComponent from "@/app/components/editor/Editor";

/**
 * Editori renderöidään vain selaimessa: se on kokonaan interaktiivinen työkalu
 * (dnd-kit, iframe-esikatselu), eikä palvelinrenderöinnistä ole hyötyä —
 * vain hydraatioeroja (dnd-kitin globaali id-laskuri).
 */
const Editor = dynamic(() => import("@/app/components/editor/Editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh flex-col bg-background">
      <div className="h-14 border-b border-border bg-card" />
      <div className="flex min-h-0 flex-1">
        <div className="w-16 border-r border-border bg-card" />
        <div className="hidden w-[300px] border-r border-border bg-card lg:block" />
        <div className="flex flex-1 items-center justify-center bg-muted/70">
          <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        </div>
      </div>
    </div>
  ),
});

export default function EditorClient(props: ComponentProps<typeof EditorComponent>) {
  return <Editor {...props} />;
}
