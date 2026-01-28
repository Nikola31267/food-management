"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndAccess = async () => {
      if (!localStorage.getItem("data-traffic-auth")) {
        router.push("/sign-in");
        return;
      }

      try {
        const response = await axiosInstance.get("/auth/user", {
          headers: {
            "x-auth-token": localStorage.getItem("data-traffic-auth"),
          },
        });
        setUser(response.data);

        if (!response.data.grade) {
          router.push("/grade");
        }

        setLoading(false);
      } catch (error) {
        setError("Failed to fetch user data");
        router.push("/sign-in");
      }
    };

    checkAuthAndAccess();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("data-traffic-auth");
    window.location.href = "/sign-in";
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center border-b border-gray-200 mb-12">
        <div className="flex items-center">
          <Link href="/dashboard">
            <Image
              src="/logo-nobg.png"
              alt="Logo"
              className="h-12 w-12 mr-2"
              width={48}
              height={48}
            />
          </Link>
        </div>
        <div className="flex items-center">
          {user?.role == "admin" ? (
            <Link
              className="block w-full text-left text-sm text-gray-700 bg-transparent border-none cursor-pointer transition-colors hover:bg-gray-100"
              href="/admin"
            >
              Admin
            </Link>
          ) : (
            <></>
          )}
          <Button
            onClick={handleLogout}
            className="block w-full text-left text-sm text-gray-700 bg-transparent border-none cursor-pointer transition-colors hover:bg-gray-100"
          >
            Sign out
          </Button>
        </div>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <h1>Имейл: {user?.email}</h1>
      <h1>Имена: {user?.fullName}</h1>

      <h1>Клас: {user?.grade}</h1>
    </div>
  );
};

export default Dashboard;
