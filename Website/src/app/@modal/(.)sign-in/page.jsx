"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "@/lib/axios";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import { useRouter } from "next/navigation";

const SignInModal = () => {
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const dialogCloseRef = useRef();

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;

    try {
      const response = await axiosInstance.post("/auth/google-signin", {
        token,
      });
      localStorage.setItem("data-traffic-auth", response.data.token);
      dialogCloseRef.current.click();
      setTimeout(() => {
        router.push("/dashboard");
      }, 300);
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

  return (
    <Dialog defaultOpen onOpenChange={() => router.back()} ref={dialogCloseRef}>
      <DialogContent className="sm:max-w-[425px] ">
        <DialogHeader>
          <DialogTitle>
            {" "}
            <div className="flex items-center justify-center gap-1 mb-4">
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
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4" z>
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
        <DialogClose ref={dialogCloseRef} />
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal;
