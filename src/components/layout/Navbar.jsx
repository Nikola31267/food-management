"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SignedIn from "../auth/SignedIn";
import SignedOut from "../auth/SignedOut";
import Image from "next/image";
import { ShinyButton } from "../ui/shiny-button";

export default function Navbar() {
  const signOut = () => {
    console.log("Signing out");
    localStorage.removeItem("data-auth-eduiteh-food");
    window.location.href = "/sign-in";
  };

  return (
    <div className="flex justify-between items-center">
      <motion.header
        className="py-4 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-between items-center w-full"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-nobg.png"
            alt="TurboVerify"
            width={60}
            height={60}
          />
          <span className="text-2xl font-bold hidden md:block">
            Food Management
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          <SignedIn>
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="text-purple-500 hover:bg-purple-50 hover:text-purple-700 mr-2"
                onClick={() => signOut()}
              >
                Sign out
              </Button>
              <ShinyButton className="h-10 w-28" href="/dashboard">
                Dashboard
              </ShinyButton>
            </div>
          </SignedIn>
          <SignedOut>
            <ShinyButton className="h-10 w-28" href="/sign-in">
              Sign in
            </ShinyButton>
          </SignedOut>
        </div>
      </motion.header>
    </div>
  );
}
