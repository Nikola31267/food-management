"use client";
import { useState, useEffect } from "react";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Home() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (localStorage.getItem("data-auth-eduiteh-food")) {
        try {
          const response = await axios.get("/api/auth/user", {
            headers: {
              "x-auth-token": localStorage.getItem("data-auth-eduiteh-food"),
            },
          });
          setUser(response.data);
          if (response.data.role == "admin") {
            router.push("/admin/statistics");
          } else {
            router.push("/dashboard");
          }
        } catch (error) {
          setError("Error fetching user profile");
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setUser(null);
        router.push("/dashboard");
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) return <Loader />;

  if (error) return <div>Error: {error}</div>;

  return;
}
