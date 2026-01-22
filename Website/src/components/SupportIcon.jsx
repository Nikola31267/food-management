"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import axios from "axios";

export default function SupportIcon() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.post("http://localhost:8000/issues/send", {
        userEmail: email,
        title,
        description,
        projectName,
        id: projectId,
      });

      const data = await response.data;
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
      setIsOpen(false);
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const projectName = "https://turboverify.vercel.app";
  const projectId = "676f26e40a5a344fe4c9c607";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          className="rounded-full w-12 h-12 fixed bottom-4 left-4 p-0 transition-all duration-300 ease-in-out"
          aria-label="Open support form"
        >
          <div className="flex flex-col items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 bg-primary text-primary-foreground">
          <h2 className="text-lg font-semibold">Have an issue?</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="Your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="Issue Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is the issue?"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
