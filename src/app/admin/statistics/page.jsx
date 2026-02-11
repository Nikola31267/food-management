"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PaymentStatus } from "@/components/dashboard/payment-status";
import { PopularItems } from "@/components/dashboard/popular-items";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Loader from "@/components/layout/Loader";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav user={user} />
      <main className="lg:pl-64">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <DashboardHeader />

          <div className="mt-6">
            <StatsCards />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <PaymentStatus />
            <PopularItems />
          </div>
        </div>
      </main>
    </div>
  );
}
