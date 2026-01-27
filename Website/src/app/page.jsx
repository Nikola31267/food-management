"use client";
import { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axios";
import Loader from "@/components/layout/Loader";
import Navbar from "@/components/layout/Navbar";

export default function Home() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (localStorage.getItem("data-traffic-auth")) {
        try {
          const response = await axiosInstance.get("/auth/user", {
            headers: {
              "x-auth-token": localStorage.getItem("data-traffic-auth"),
            },
          });
          setUser(response.data);
        } catch (error) {
          setError("Error fetching user profile");
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setUser(null);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) return <Loader />;

  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <Navbar />
    </>
  );
}
