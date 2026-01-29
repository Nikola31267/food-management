"use client";

import { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axios";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Loader from "@/components/layout/Loader";

export default function Login() {
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();

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
    <div className="flex flex-col gap-8 items-center justify-center min-h-screen relative">
      <div className="flex flex-col gap-4 px-14 py-8 rounded-xl shadow-xl bg-gray-50">
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/logo-nobg.png"
            alt="Project Logo"
            className=" w-14"
            draggable={false}
            width={56}
            height={56}
          />

          <h2 className="text-xl font-semibold">Food Management</h2>
        </div>

        <div className="flex items-center justify-center">
          <GoogleOAuthProvider
            clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
          >
            <div>
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginFailure}
                theme="outline"
                size="large"
                width="350px"
                logo_alignment="left"
                type="standard"
                text="continue_with"
              />
            </div>
          </GoogleOAuthProvider>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        {message && <p className="text-green-500">{message}</p>}
      </div>
    </div>
  );
}
