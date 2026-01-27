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
import { useState } from "react";
import { axiosInstance } from "@/lib/axios";

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
    } catch (err) {
      console.error(err);
      alert("Failed to save grade");
    } finally {
      setLoading(false);
    }
  };

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
