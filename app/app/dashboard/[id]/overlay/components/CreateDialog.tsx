"use client";

import { Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";

/** Pääpainike, joka avaa luontilomakkeen dialogiin. */
export default function CreateDialog({
  trigger,
  title,
  description,
  children,
  variant = "default",
}: {
  trigger: string;
  title: string;
  description: string;
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm">
          <Plus aria-hidden />
          {trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
