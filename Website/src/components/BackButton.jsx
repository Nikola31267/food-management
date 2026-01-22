"use client";

import React from "react";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const BackButton = () => {
  const router = useRouter();
  return (
    <Button
      onClick={() => router.back()}
      className="flex items-center gap-2 bg-gray-100 shadow-md hover:bg-gray-100 text-black px-5 py6 dark:bg-gray-700 dark:text-white"
    >
      <ArrowLeft />
      Back
    </Button>
  );
};

export default BackButton;
