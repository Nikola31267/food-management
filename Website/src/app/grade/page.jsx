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

const CLASSES = {
  8: ["8а", "8б", "8в"],
  9: ["9а", "9б", "9в"],
  10: ["10а", "10б", "10в"],
  11: ["11а", "11б", "11в"],
  12: ["12а", "12б", "12в", "12г"],
};

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

  if (loadingAuth) {
    return <Loader />;
  }

  return (
    <div className="flex gap-3 items-center">
      {/* Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{selectedGrade || "Изберете клас"}</Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
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

      {/* Save button */}
      <Button onClick={handleSave} disabled={!selectedGrade || loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
