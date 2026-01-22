"use client";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ChevronsUpDown, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Navigation = ({
  dashboardPage,
  projects,
  user,
  toggleDropdown,
  dropdownRef,
  project,
  isDropdownOpen,
  setIsDropdownOpen,
  activeTab,
}) => {
  const router = useRouter();

  return (
    <Breadcrumb className="px-2 py-1 w-full sm:w-auto">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink className="text-lg" href="/dashboard">
            {user?.fullName ? user.fullName : user.username}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {!dashboardPage && (
          <>
            <BreadcrumbItem ref={dropdownRef} className="relative">
              <BreadcrumbLink className="text-lg" asChild>
                <button onClick={toggleDropdown} className="flex items-center">
                  {project?.projectName.replace(/^https?:\/\//, "")}
                  <ChevronsUpDown className="ml-2 h-4 w-4" />
                </button>
              </BreadcrumbLink>
              {isDropdownOpen && (
                <div
                  className="absolute bg-[#fbfcfd] shadow-md w-full sm:w-52 rounded-md z-10"
                  style={{ top: "100%", left: 0 }}
                >
                  {projects.map((proj) => (
                    <div
                      key={proj._id}
                      className="px-4 py-2 hover:bg-gray-200 rounded-md cursor-pointer flex items-center gap-1"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push(`/dashboard/projects/${proj._id}`);
                      }}
                    >
                      <Image
                        src={proj.logo || "/logo-nobg.png"}
                        alt={proj.projectName}
                        width={25}
                        height={25}
                      />
                      {proj.projectName.replace(/^https?:\/\//, "")}
                    </div>
                  ))}
                  <hr className="border-t border-gray-200 my-2" />
                  <div
                    className="px-4 py-2 hover:bg-gray-200 rounded-md cursor-pointer flex items-center"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push(`/dashboard/new`);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> New Project
                  </div>
                </div>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-lg cursor-default">
                {activeTab === "app" && ""}
                {activeTab === "issues" && "Issues"}
                {activeTab === "settings" && "Settings"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Navigation;
