"use client";

import React, { useState } from "react";
import { Files, Loader2 } from "lucide-react";
import axios from "axios";
import { axiosInstance } from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

const FindSnippet = ({ projectName, projectId, projectPage }) => {
  const [snippetFound, setSnippetFound] = useState(null);
  const [error, setError] = useState(null);
  const [verifyClicked, setVerifyClicked] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const codeSnippet =
    `<script src="https://tracking-website-rosy.vercel.app/js/tracker.js" \n` +
    `        data-website-url="${projectName}" data-project-id="${projectId}" async></script>`;

  const handleVerifyInstallation = async () => {
    setVerifyClicked(true);
    setLoading(true);
    try {
      const checkResponse = await axios.get(
        `/api/check-snippet?url=${encodeURIComponent(projectName)}`
      );
      setSnippetFound(checkResponse.data.snippetFound);

      if (checkResponse.data.snippetFound) {
        await axiosInstance.put(`/create/${projectId}`);
        setTimeout(() => {
          if (projectPage) {
            window.location.reload();
          } else {
            router.push(`/dashboard/projects/${projectId}`);
          }
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.error || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h1 className="text-lg font-bold text-gray-700">Installation Script</h1>
      <p className="text-gray-700">
        Paste the following code into the <code>&lt;body&gt;</code> tag.
      </p>
      <hr className="border-gray-300 my-4" />
      <div className="flex justify-end items-center space-x-4">
        <button
          onClick={() => navigator.clipboard.writeText(codeSnippet)}
          className="text-gray-700 hover:text-gray-900 bg-gray-200 hover:bg-gray-300 p-2 rounded-lg font-semibold transition-colors duration-300 mt-3"
        >
          <Files className="w-5 h-5" />
        </button>
      </div>
      {codeSnippet && (
        <>
          <div className="mt-4 p-4 bg-gray-900 rounded-lg relative">
            <pre className="bg-gray-800 text-gray-300 p-4 rounded overflow-x-auto">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        </>
      )}

      <div className="flex justify-center items-center space-x-4 mt-4">
        <Button
          onClick={handleVerifyInstallation}
          className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg font-semibold transition-colors duration-300 w-full"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Verify Installation"
          )}
        </Button>
      </div>
      {verifyClicked && error && (
        <div className="text-red-500 mt-4">{error}</div>
      )}
      {verifyClicked && snippetFound && (
        <div className="text-green-500 mt-4">
          Snippet found! Redirecting ...
        </div>
      )}
      {verifyClicked && snippetFound === false && (
        <div className="text-red-500 mt-4">
          Snippet not found. Please add it to your code.
        </div>
      )}
    </div>
  );
};

export default FindSnippet;
