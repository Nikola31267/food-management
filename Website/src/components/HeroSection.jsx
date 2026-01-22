"use client";

import Image from "next/image";
import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { ShinyButton } from "./ui/shiny-button";
import { Zap, ArrowRight } from "lucide-react";

const HeroSection = () => {
  const router = useRouter();

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/${targetId}`);
    }
  };

  return (
    <div className="pt-6">
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              <span>Real-time traffic monitoring</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Monitor Your Data Traffic
              <span className="block text-transparent bg-clip-text bg-purple-500">
                In Real Time
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Gain complete visibility into your network traffic with advanced
              analytics, real-time monitoring, and intelligent insights that
              help you make data-driven decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ShinyButton
                className="px-8 py-4 border-2 border-purple-600"
                href="/sign-in"
              >
                Get Started
              </ShinyButton>
              <button className="px-8 py-4 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all border-2 border-gray-200 text-lg font-medium">
                Watch Demo
              </button>
            </div>
            <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
