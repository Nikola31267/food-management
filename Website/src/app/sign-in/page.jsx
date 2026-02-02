"use client";

import { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";
import Loader from "@/components/layout/Loader";
import SignInCard from "@/components/auth/SignInCard";
import { toast } from "react-toastify";

export default function Login() {
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (
      localStorage.getItem("data-traffic-auth") ||
      !localStorage.getItem("data-traffic-auth") === null ||
      !localStorage.getItem("data-traffic-auth") === ""
    ) {
      router.push("/dashboard");
    } else {
      setLoadingAuth(false);
    }
  }, [router]);

  useEffect(() => {
    if (searchParams.get("logged_out")) {
      toast.success("Успешно излязохте от профила си!");
    }
  }, [searchParams]);

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;

    try {
      const response = await axiosInstance.post("/auth/google-signin", {
        token,
      });
      localStorage.setItem("data-traffic-auth", response.data.token);
      if (response.data.user.role == "teacher") {
        router.push("/dashboard");
      }
      router.push("/grade");
    } catch (error) {
      console.error(
        "Google login failed:",
        error.response ? error.response.data : error.message,
      );
    }
  };
  const handleGoogleLoginFailure = () => {
    setError("Google login failed");
  };

  if (loadingAuth) {
    return <Loader />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignInCard
          handleGoogleLoginSuccess={handleGoogleLoginSuccess}
          handleGoogleLoginFailure={handleGoogleLoginFailure}
        />
      </div>
    </main>
  );
}
