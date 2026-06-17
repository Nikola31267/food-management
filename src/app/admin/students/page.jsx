"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { useRouter } from "next/navigation";
import Loader from "@/components/layout/Loader";
import axios from "axios";
import { Loader2, Trash } from "lucide-react";

const Page = () => {
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
      try {
        const response = await axios.get("/api/auth/user");
        setUser(response.data);

        if (response.data.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        setLoadingStudents(true);
        const studentsRes = await axios.get("/api/students/get");
        setStudents(studentsRes.data);
      } catch (error) {
        console.error(error);
        router.push("/sign-in");
      } finally {
        setLoading(false);
        setLoadingStudents(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const deleteStudent = async (id) => {
    if (!id) return;

    const ok = window.confirm("Искате ли да изтриете този ученик?");
    if (!ok) return;

    try {
      setSubmiting(true);
      setDeletingId(id);

      await axios.delete("/api/students/delete", { data: { id } });

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
        .filter((g) => g !== null && g !== undefined && g !== "")
    );

    return Array.from(set).sort();
  }, [students]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNav user={user} />

      <main
        className="
          transition-all duration-300
          px-4 py-4
          sm:px-6 sm:py-6
          lg:pl-[var(--sidebar-width,16rem)]
        "
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-5">
            <h1 className="text-xl font-semibold sm:text-2xl">Ученици</h1>
            <p className="mt-1 text-sm text-gray-500">
              Управление на учениците в системата.
            </p>
          </div>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Търсене по име..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full rounded-full border bg-white p-3
                outline-none
                focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]
              "
            />

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="
                w-full rounded-full border bg-white p-3
                outline-none
                focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]
                sm:w-44
              "
            >
              <option value="">Всички класове</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  Клас {g}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {!loadingStudents && filteredStudents.length === 0 && (
              <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">
                Няма намерени ученици.
              </div>
            )}

            {filteredStudents.map((s) => (
              <div
                key={s._id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {s.fullName || s.email || "—"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Клас: {s.grade || "—"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteStudent(s._id)}
                    disabled={deletingId === s._id}
                    className="
                      shrink-0 rounded-lg bg-red-600 p-2 text-white
                      transition-colors duration-300
                      hover:bg-red-700
                      disabled:cursor-not-allowed disabled:opacity-60
                    "
                    title="Delete student"
                  >
                    {deletingId === s._id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="p-4 font-medium text-gray-600">Име</th>
                    <th className="p-4 font-medium text-gray-600">Клас</th>
                    <th className="w-24 p-4 font-medium text-gray-600">
                      Действия
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {!loadingStudents && filteredStudents.length === 0 && (
                    <tr>
                      <td className="p-4 text-gray-500" colSpan={3}>
                        Няма намерени ученици.
                      </td>
                    </tr>
                  )}

                  {filteredStudents.map((s) => (
                    <tr key={s._id} className="border-t">
                      <td className="p-4">{s.fullName || s.email || "—"}</td>
                      <td className="p-4">{s.grade || "—"}</td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => deleteStudent(s._id)}
                          disabled={deletingId === s._id}
                          className="
                            rounded-lg bg-red-600 p-2 text-white
                            transition-colors duration-300
                            hover:bg-red-700
                            disabled:cursor-not-allowed disabled:opacity-60
                          "
                          title="Delete student"
                        >
                          {deletingId === s._id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Page;