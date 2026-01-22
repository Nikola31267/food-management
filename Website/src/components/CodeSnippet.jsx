"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, Clipboard } from "lucide-react";

export default function CodeSnippetDialog({ code, title, dialogTitle, toast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (code) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setIsCopied(true);
        toast({ title: "Success", description: "Code copied to clipboard." });
        setTimeout(() => {
          setIsCopied(false);
        }, 1000);
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to copy code to clipboard.",
        });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="purple" className="btn">
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[60rem]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="relative mockup-code bg-gray-100 text-gray-900">
          <pre>
            <code>{code}</code>
          </pre>
          <button
            className="absolute top-2 right-2 btn btn-sm bg-transparent border-none bg-gray-200 hover:bg-gray-300 text-gray-900 transition-colors duration-300 rounded-lg"
            onClick={() => handleCopy(code)}
          >
            {isCopied ? <Check /> : <Clipboard />}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
