"use client";
import { useState, useEffect } from "react";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/auth/user");
        if (response.data.role === "admin") {
          router.push("/admin/statistics");
        } else {
          router.push("/dashboard");
        }
      } catch {
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) return <Loader />;
  return null;
}
