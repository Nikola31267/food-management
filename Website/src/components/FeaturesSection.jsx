"use client";

import { useState } from "react";
import {
  Zap,
  ArrowRight,
  BarChart3,
  Shield,
  TrendingUp,
  Globe,
  Lock,
} from "lucide-react";

export default function FeaturesSection() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to monitor, analyze, and optimize your network
            traffic
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="group p-8 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Real-Time Analytics
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Monitor your traffic patterns with live updates and instant
              insights into bandwidth usage and performance metrics.
            </p>
          </div>

          <div className="group p-8 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Advanced Security
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Detect anomalies and potential threats with AI-powered security
              monitoring and instant alerts.
            </p>
          </div>

          <div className="group p-8 bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Lightning Fast
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Process millions of data points per second with our optimized
              infrastructure and edge computing.
            </p>
          </div>

          <div className="group p-8 bg-gradient-to-br from-cyan-50 to-white rounded-2xl border border-gray-100 hover:border-cyan-200 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Predictive Insights
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Leverage machine learning to forecast traffic trends and optimize
              resource allocation proactively.
            </p>
          </div>

          <div className="group p-8 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Global Coverage
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Monitor traffic across multiple regions and data centers with
              unified dashboard and reporting.
            </p>
          </div>

          <div className="group p-8 bg-gradient-to-br from-rose-50 to-white rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-rose-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Enterprise Grade
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Bank-level encryption, compliance certifications, and dedicated
              support for mission-critical operations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
