"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { useRouter } from "next/navigation";
import Loader from "@/components/layout/Loader";
import axios from "axios";
import { Loader2, Trash } from "lucide-react";

const page = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState("");
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [submiting, setSubmiting] = useState(false);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");

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
          if (response.data.role != "admin") {
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

  const deleteStudent = async (id) => {
    if (!id) return;

    const ok = window.confirm("Искате ли да изтриете този ученик?");
    if (!ok) return;

    try {
      setSubmiting(true);
      setDeletingId(id);

      await axios.delete("/api/students/delete", {
        data: { id },
        headers: {
          "x-auth-token": localStorage.getItem("data-auth-eduiteh-food"),
        },
      });

      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete student.");
    } finally {
      setDeletingId(null);
      setSubmiting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const name = (s.fullName || s.email || "").toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());

      const matchesGrade =
        !gradeFilter || String(s.grade) === String(gradeFilter);

      return matchesSearch && matchesGrade;
    });
  }, [students, search, gradeFilter]);

  const grades = useMemo(() => {
    const set = new Set(
      students
        .map((s) => s.grade)
        .filter((g) => g !== null && g !== undefined && g !== ""),
    );
    return Array.from(set).sort();
  }, [students]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen">
      <SidebarNav user={user} />

      <main className="lg:pl-64 p-4 ml-4">
        <h1 className="text-2xl font-semibold mb-4">Ученици</h1>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Търсене по име..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 p-3 border rounded-full w-full outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-[#478BAF]"
          />

          <div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full sm:w-40 p-3 border rounded-full focus:outline-none focus:ring-[#478BAF]"
            >
              <option value="">Всички класове</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  Клас {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-3">Име</th>
                  <th className="p-3">Клас</th>
                  <th className="p-3 w-16">Действия</th>
                </tr>
              </thead>

              <tbody>
                {!loadingStudents && filteredStudents.length === 0 && (
                  <tr>
                    <td className="p-3 opacity-70" colSpan={3}>
                      Няма намерени ученици.
                    </td>
                  </tr>
                )}

                {students.map((s) => (
                  <tr key={s._id} className="border-t">
                    <td className="p-3">{s.fullName || s.email || "—"}</td>
                    <td className="p-3">{s.grade || "—"}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => deleteStudent(s._id)}
                        disabled={deletingId === s._id}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-300"
                        title="Delete student"
                      >
                        {submiting ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Trash />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default page;
