"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { ShinyButton } from "../ui/shiny-button";

export default function Navbar() {
  return (
    <div className="flex justify-between items-center">
      <motion.header
        className="py-4 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-between items-center w-full"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo-nobg.png"
            alt="TurboVerify"
            width={60}
            height={60}
          />
        </Link>
        <div className="flex items-center space-x-4 ">
          <div className="flex items-center gap-4">
            <ShinyButton className="h-10 w-28" href="/admin/orders">
              Поръчки
            </ShinyButton>
            <ShinyButton className="h-10 w-28" href="/admin">
              Меню
            </ShinyButton>
          </div>
        </div>
      </motion.header>
    </div>
  );
}
