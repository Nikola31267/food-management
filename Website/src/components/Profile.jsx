"use client";

import React, { useState, useEffect, useRef } from "react";
import { axiosInstance } from "@/lib/axios";
import Image from "next/image";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./ui/alert-dialog";

const Profile = ({ isOpen, onClose, initialTab = "account" }) => {
  const [editProfile, setEditProfile] = useState({
    username: "",
    email: "",
    fullName: "",
    profilePicture: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [accountTab, setAccountTab] = useState(initialTab === "account");
  const [securityEditing, setSecurityEditing] = useState(
    initialTab === "security"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    fullName: "",
    profilePicture: null,
    socialConnected: [],
  });

  const modalRef = useRef(null);

  const [accountToDelete, setAccountToDelete] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const response = await axiosInstance.get("/auth/user", {
        headers: { "x-auth-token": localStorage.getItem("data-traffic-auth") },
      });

      setProfile(response.data);
      setEditProfile({
        username: response.data.username,
        email: response.data.email,
        fullName: response.data.fullName,
        profilePicture: response.data.profilePicture,
      });
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen && !showDeleteModal && !accountToDelete) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, showDeleteModal, accountToDelete, false]);

  useEffect(() => {
    setAccountTab(initialTab === "account");
    setSecurityEditing(initialTab === "security");
  }, [initialTab]);

  const handleProfileChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePicture") {
      const file = files[0];
      setEditProfile((prev) => ({ ...prev, profilePicture: file }));
      setProfilePicturePreview(URL.createObjectURL(file));
    } else {
      setEditProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("username", editProfile.username);
      formData.append("email", editProfile.email);
      formData.append("fullName", editProfile.fullName);
      if (editProfile.profilePicture) {
        formData.append("profilePicture", editProfile.profilePicture);
      }

      const response = await axiosInstance.put(
        "/auth/updateProfile",
        formData,
        {
          headers: {
            "x-auth-token": localStorage.getItem("data-traffic-auth"),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfile(response.data);
      setIsEditing(false);
    } catch (error) {
      setError(error.response?.data || error.message);
      console.error(
        "Failed to update profile:",
        error.response?.data || error.message
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureDelete = async () => {
    try {
      const response = await axiosInstance.put(
        "/auth/deleteProfilePicture",
        null,
        {
          headers: {
            "x-auth-token": localStorage.getItem("data-traffic-auth"),
          },
        }
      );

      if (response.status === 200) {
        setProfile((prev) => ({ ...prev, profilePicture: "" }));
      } else {
        console.error("Failed to delete profile picture", response.data);
      }
    } catch (error) {
      console.log(
        "Error deleting profile picture:",
        error.response?.data || error.message
      );
    }
  };

  const handleProfileDelete = async () => {
    try {
      const response = await axiosInstance.delete("/auth/delete-account", {
        headers: {
          "x-auth-token": localStorage.getItem("data-traffic-auth"),
        },
      });

      if (response.status === 200) {
        console.log("Account deleted successfully");
        localStorage.removeItem("data-traffic-auth");
        window.location.href = "/";
      } else {
        console.error("Failed to delete account", response.data);
      }
    } catch (error) {
      console.error(
        "Error deleting account:",
        error.response?.data || error.message
      );
    }
  };

  const handleRemoveAccount = async (accountName) => {
    setAccountToDelete(accountName);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl h-auto overflow-hidden flex relative"
        style={{ width: "80%", height: "80%" }}
      >
        <div className="w-1/4 border-r border-gray-300 flex flex-col justify-between sticky top-0 no-scrollbar">
          <div className="px-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setSecurityEditing(false);
                setAccountTab(true);
              }}
              className={`w-full flex items-center gap-2 text-left px-4 py-2 text-sm rounded-lg text-gray-700 transition-colors ${
                accountTab ? "bg-gray-200 text-purple-500" : "hover:bg-gray-200"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
                className="cl-navbarButtonIcon cl-navbarButtonIcon__account"
                width="20"
                height="20"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-2.585 2.894c.154.25.107.568-.083.792A5.675 5.675 0 0 1 8 13.688a5.675 5.675 0 0 1-4.332-2.002c-.19-.224-.237-.543-.083-.792.087-.14.189-.271.306-.392.46-.469 1.087-.986 1.703-1.102.514-.097.899.056 1.298.214.331.132.673.267 1.108.267.435 0 .777-.135 1.108-.267.4-.158.784-.31 1.298-.214.616.116 1.243.633 1.703 1.102.117.12.22.252.306.392ZM8 8.919c1.329 0 2.406-1.559 2.406-2.888a2.406 2.406 0 1 0-4.812 0C5.594 7.361 6.67 8.92 8 8.92Z"
                ></path>
              </svg>
              Account
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setSecurityEditing(true);
                setAccountTab(false);
              }}
              className={`w-full flex items-center gap-2 text-left px-4 py-2 text-sm rounded-lg text-gray-700 transition-colors ${
                securityEditing
                  ? "bg-gray-200 text-purple-500"
                  : "hover:bg-gray-200"
              }`}
            >
              <svg
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                className="cl-navbarButtonIcon cl-navbarButtonIcon__security 🔒️ cl-internal-141wpcl"
                width="20"
                height="20"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.748 2.91a.48.48 0 0 1 .124.083c.088.082.14.193.126.31v4.054a7.58 7.58 0 0 1-1.227 4.147c-.99 1.52-3.778 3.038-4.563 3.445a.45.45 0 0 1-.416 0c-.785-.407-3.576-1.925-4.565-3.445A7.61 7.61 0 0 1 2 7.357V3.303a.43.43 0 0 1 .14-.31.484.484 0 0 1 .334-.13h.027c2.162 0 4.132-.655 5.148-1.714A.485.485 0 0 1 8.004 1c.137 0 .266.054.355.149 1.016 1.056 2.99 1.714 5.148 1.714h.027c.076 0 .149.016.214.046Zm-2.695 3.097a.75.75 0 0 0-1.106-1.014c-.9.983-1.363 1.624-2.013 2.787-.218.39-.442.876-.626 1.305l-1.242-1.43a.75.75 0 0 0-1.132.982l2.042 2.354a.75.75 0 0 0 1.269-.227v-.003l.005-.011.018-.046a22.354 22.354 0 0 1 .305-.762c.199-.474.447-1.03.67-1.43.594-1.062.988-1.608 1.81-2.505Z"
                ></path>
              </svg>
              Security
            </button>
          </div>
          <div className="px-4 py-2 text-sm text-gray-700">
            Created by <span className="font-bold">TurboVerify</span>
          </div>
        </div>
        <div className="w-3/4 p-6 overflow-y-auto no-scrollbar">
          {accountTab && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="flex w-full items-center justify-between">
                  <div className="text-gray-700 text-lg font-semibold">
                    Profile
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-purple-600 px-4 py-2 rounded-md bg-transparent border-none cursor-pointer transition-colors duration-200 font-medium hover:bg-purple-100 hover:text-purple-500"
                    >
                      Edit profile
                    </button>
                  )}
                </div>
                <div className="relative mt-4">
                  {profile ? (
                    profilePicturePreview ? (
                      <Image
                        src={profilePicturePreview}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                      />
                    ) : profile?.profilePicture ? (
                      <Image
                        src={profile.profilePicture}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-300 text-white flex items-center justify-center rounded-full border-2 border-gray-300 text-4xl font-semibold cursor-default select-none">
                        {profile?.fullName
                          ? profile.fullName
                              .split(" ")
                              .map((name) => name[0])
                              .slice(0, 2)
                              .join("")
                          : ""}
                      </div>
                    )
                  ) : (
                    ""
                  )}
                  {isEditing && (
                    <input
                      type="file"
                      name="profilePicture"
                      onChange={handleProfileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={handleProfilePictureDelete}
                    className="text-red-500 mt-6 rounded-md bg-transparent border-none cursor-pointer transition-colors hover:text-red-600"
                  >
                    Delete profile picture
                  </button>
                )}
              </div>
              <div className="mb-6">
                <div className="text-gray-700 text-lg mb-4 font-semibold">
                  User Information
                </div>
                {isEditing && error && (
                  <p className="text-red-500 mt-2 mb-2">
                    {typeof error === "object" ? error.message : error}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={
                        isEditing ? editProfile.fullName : profile.fullName
                      }
                      onChange={handleProfileChange}
                      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 ${
                        isEditing ? "bg-white" : "bg-transparent"
                      } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={
                        isEditing ? editProfile.username : profile.username
                      }
                      onChange={handleProfileChange}
                      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 ${
                        isEditing ? "bg-white" : "bg-transparent"
                      } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={isEditing ? editProfile.email : profile.email}
                      onChange={handleProfileChange}
                      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 ${
                        isEditing ? "bg-white" : "bg-transparent"
                      } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
              {!isEditing && (
                <div className="mb-6">
                  <div className="text-gray-700 text-lg mb-4 font-semibold">
                    Connected Accounts
                  </div>
                  <div className="flex flex-col">
                    {profile?.socialConnected?.length > 0 ? (
                      profile.socialConnected.map((account, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center gap-1"
                        >
                          <div className="flex items-center gap-2">
                            <Image
                              src={account.image}
                              alt={account.name}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full"
                            />
                            <span className="text-gray-700 capitalize flex items-center gap-2">
                              {account.name}
                            </span>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                onClick={() =>
                                  handleRemoveAccount(account.name)
                                }
                                className="text-red-500 font-medium px-4 py-2 rounded-md bg-transparent border-none cursor-pointer transition-colors hover:bg-red-100"
                              >
                                Remove
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure you want to disconnect this
                                  account?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will disconnect your social
                                  account.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel asChild>
                                  <button
                                    onClick={() => setAccountToDelete(null)}
                                  >
                                    Cancel
                                  </button>
                                </AlertDialogCancel>
                                <AlertDialogAction asChild>
                                  <button
                                    onClick={async () => {
                                      if (accountToDelete) {
                                        try {
                                          const response =
                                            await axiosInstance.put(
                                              "/auth/disconnect-social",
                                              { social: accountToDelete },
                                              {
                                                headers: {
                                                  "x-auth-token":
                                                    localStorage.getItem(
                                                      "data-traffic-auth"
                                                    ),
                                                },
                                              }
                                            );

                                          if (response.status === 200) {
                                            console.log(
                                              "Social disconnected successfully"
                                            );
                                            setProfile((prev) => ({
                                              ...prev,
                                              socialConnected:
                                                prev.socialConnected.filter(
                                                  (account) =>
                                                    account.name !==
                                                    accountToDelete
                                                ),
                                            }));
                                          } else {
                                            console.error(
                                              "Failed to disconnect social account",
                                              response.data
                                            );
                                          }
                                        } catch (error) {
                                          console.error(
                                            "Error disconnecting social account:",
                                            error.response?.data ||
                                              error.message
                                          );
                                        }
                                      }
                                      setAccountToDelete(null);
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md border-none cursor-pointer transition-colors duration-200"
                                  >
                                    Disconnect
                                  </button>
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-base">
                        No accounts connected
                      </div>
                    )}
                  </div>
                </div>
              )}
              {isEditing && (
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setError("");
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-white px-4 py-2 rounded-md border-none cursor-pointer transition-colors duration-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleProfileSave}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md border-none cursor-pointer flex items-center"
                    disabled={isSaving}
                  >
                    {isSaving && (
                      <svg
                        className="animate-spin h-5 w-5 mr-3 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>
                    )}
                    Save
                  </button>
                </div>
              )}
            </>
          )}
          {securityEditing && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center gap-4">
                <span className="text-gray-700 font-semibold">
                  Account Termination
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="text-red-500 font-medium px-4 py-2 rounded-md bg-transparent border-none cursor-pointer transition-colors hover:bg-red-100"
                    >
                      Delete Account
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to delete your account?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove your data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel asChild>
                        <button onClick={() => setShowDeleteModal(false)}>
                          Cancel
                        </button>
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <button
                          onClick={handleProfileDelete}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md border-none cursor-pointer transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
