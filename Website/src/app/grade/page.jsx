"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { useRouter } from "next/navigation";
import Loader from "@/components/layout/Loader";
import { ChevronRight } from "lucide-react";
import { ShinyButton } from "@/components/ui/shiny-button";

const CLASSES = {
  8: ["8а", "8б", "8в"],
  9: ["9а", "9б", "9в"],
  10: ["10а", "10б", "10в"],
  11: ["11а", "11б", "11в"],
  12: ["12а", "12б", "12в", "12г"],
};

const grades = [
  { value: "6", label: "Grade 6" },
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
];

export default function DropdownMenuBasic() {
  const [selectedGrade, setSelectedGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState(null);
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

        if (response.data.grade) {
          router.push("/dashboard");
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

  const handleSave = async () => {
    if (!selectedGrade) {
      alert("Please select a class first");
      return;
    }

    try {
      setLoading(true);

      await axiosInstance.put(
        "/auth/grade",
        { grade: selectedGrade },
        {
          headers: {
            "x-auth-token": localStorage.getItem("data-traffic-auth"),
          },
        },
      );

      alert("Grade saved successfully ✅");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to save grade");
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    console.log("Signing out");
    localStorage.removeItem("data-traffic-auth");
    window.location.href = "/sign-in";
  };

  if (loadingAuth) {
    return <Loader />;
  }

  return (
    <div className="flex gap-3 items-center">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
            {/* Step Indicator */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#478BAF] text-sm font-medium text-white">
                1
              </div>
              <span className="text-lg font-medium text-foreground">
                Здравей {user?.fullName},
              </span>
            </div>

            <p className="text-muted-foreground mb-6 leading-relaxed">
              Моля изберете клас за да можем да ви разпределим правилно и да
              получите Вашата храната спокойно.
            </p>
            <div className="flex flex-col gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#478BAF] focus-visible:ring-offset-2"
                  >
                    {selectedGrade || "Изберете клас"}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto">
                  {Object.values(CLASSES).map((group, index) => (
                    <div key={index}>
                      <DropdownMenuGroup>
                        {group.map((item) => (
                          <DropdownMenuItem
                            key={item}
                            onClick={() => setSelectedGrade(item)}
                          >
                            {item}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>

                      {index < Object.values(CLASSES).length - 1 && (
                        <DropdownMenuSeparator />
                      )}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <ShinyButton
                href="#"
                onClick={handleSave}
                disabled={!selectedGrade || loading}
                className="w-full h-12 text-base font-medium gap-2"
              >
                Напред
                <ChevronRight className="h-4 w-4" />
              </ShinyButton>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Грешен профил?{" "}
            <button
              type="button"
              onClick={signOut}
              className="text-[#478BAF] hover:underline font-medium transition-all duration-200"
            >
              Излез
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
