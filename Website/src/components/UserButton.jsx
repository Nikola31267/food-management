"use client";

import { useEffect, useState, useRef } from "react";
import { axiosInstance } from "@/lib/axios";
import Image from "next/image";
import Profile from "./Profile";
import { Button } from "./ui/button";

const UserButton = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [justClosedResetPassword, setJustClosedResetPassword] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
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
    };

    fetchUserProfile();
  }, []);

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

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleProfileModal = () => {
    setProfileModalOpen(!profileModalOpen);
    setDropdownOpen(false);
    if (!profileModalOpen) {
      setJustClosedResetPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("data-traffic-auth");
    window.location.href = "/sign-in";
  };

  if (error) return <div>{error}</div>;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`flex text-sm rounded-full md:me-0 focus:ring-1 ${
          dropdownOpen ? "bg-gray-200" : "bg-gray-200"
        } focus:ring-purple-500`}
        id="user-menu-button"
        aria-expanded={dropdownOpen}
        onClick={toggleDropdown}
      >
        <span className="sr-only">Open user menu</span>
        {user?.profilePicture ? (
          <Image
            src={user.profilePicture}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
            width={40}
            height={40}
          />
        ) : (
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full border-2 text-lg font-semibold cursor-pointer ${
              loading
                ? "bg-gray-200 border-gray-100 text-transparent"
                : "bg-gray-300 border-gray-200 text-white"
            }`}
          >
            {user?.fullName
              ? user.fullName
                  .split(" ")
                  .map((name) => name[0])
                  .slice(0, 2)
                  .join("")
              : user?.email?.charAt(0).toUpperCase() ||
                user?.username?.charAt(0).toUpperCase()}
          </div>
        )}
      </button>
      {dropdownOpen && !profileModalOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg z-10 overflow-hidden">
          <div className="p-3">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-400 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-400 rounded w-1/2"></div>
              </div>
            ) : (
              <>
                <span className="block text-sm text-gray-900">
                  {user?.fullName || "Undefined"}
                </span>
                <span className="block text-sm text-gray-500 truncate">
                  {user?.email || "Undefined"}
                </span>
              </>
            )}
          </div>
          <hr className="border-gray-100" />
          <ul className="py-2" aria-labelledby="user-menu-button">
            <li>
              <Button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-transparent border-none cursor-pointer transition-colors hover:bg-gray-100"
                onClick={toggleProfileModal}
              >
                Profile
              </Button>
            </li>
            <li>
              <Button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-transparent border-none cursor-pointer transition-colors hover:bg-gray-100"
              >
                Sign out
              </Button>
            </li>
            <hr className="border-gray-200 my-2" />
            <p className="text-gray-500 text-sm px-4 py-2">
              Created by <span className="font-bold">TurboVerify</span>
            </p>
          </ul>
        </div>
      )}

      {profileModalOpen && (
        <Profile
          isOpen={profileModalOpen}
          onClose={toggleProfileModal}
          initialTab={justClosedResetPassword ? "security" : "account"}
        />
      )}
    </div>
  );
};

export default UserButton;
