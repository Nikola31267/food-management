"use client";

import { useEffect, useState, useRef } from "react";
import { BarChart, Plus, Sparkles, XIcon, Zap } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import UserButton from "@/components/UserButton";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/Navigation";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState("");
  const [last24HoursVisits, setLast24HoursVisits] = useState("");
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

        if (!response.data.hasAccess) {
          router.push("/dashboard/pricing");
        } else {
          setLoadingAuth(false);
        }
      } catch (error) {
        setError("Failed to fetch user data");
        router.push("/sign-in");
      }
    };

    checkAuthAndAccess();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  if (loadingAuth) {
    return <Loader />;
  }

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
          <div className="relative" ref={dropdownRef}>
            <Navigation dashboardPage={true} user={user} />
          </div>
        </div>
        <UserButton />
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <h1>{user.email}</h1>
    </div>
  );
};

export default Dashboard;
