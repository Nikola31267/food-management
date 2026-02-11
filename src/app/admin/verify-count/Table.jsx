"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Loader from "@/components/layout/Loader";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { useRouter } from "next/navigation";

const DAYS = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

export default function DailyOrdersPage() {
  const searchParams = useSearchParams();
  const menuId = searchParams.get("menuId");

  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [savingDay, setSavingDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("data-auth-eduiteh-food");
        if (!token) return router.push("/sign-in");

        const userRes = await axios.get("/api/auth/user", {
          headers: { "x-auth-token": token },
        });

        if (userRes.data.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        setUser(userRes.data);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("data-auth-eduiteh-food");
  }

  async function load() {
    if (!menuId) return;

    const token = getToken();
    if (!token) {
      setError("Няма токен. Моля логни се.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/api/verify-count", {
        params: { menuId },
        headers: { "x-auth-token": token },
      });

      const hydrated = res.data.map((d) => ({
        ...d,
        items: (d.items || []).map((x) => ({
          ...x,
          deliveredCount:
            x.deliveredCount === null || x.deliveredCount === undefined
              ? ""
              : String(x.deliveredCount),
        })),
      }));

      setData(hydrated);
    } catch (err) {
      console.error(err);
      setError("Грешка при зареждане.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [menuId]);

  const dayMap = useMemo(() => {
    const m = new Map(data.map((d) => [d.day, d]));
    return DAYS.map((day) => m.get(day) || { day, items: [] });
  }, [data]);

  function updateDelivered(day, mealName, value) {
    setData((prev) =>
      prev.map((d) =>
        d.day !== day
          ? d
          : {
              ...d,
              items: d.items.map((x) =>
                x.mealName === mealName ? { ...x, deliveredCount: value } : x,
              ),
            },
      ),
    );
  }

  async function saveDay(day) {
    const token = getToken();
    if (!token) {
      setError("No token found");
      return;
    }

    setSavingDay(day);
    setError("");

    try {
      const current = dayMap.find((d) => d.day === day);

      await axios.put(
        `/api/verify-count/${encodeURIComponent(day)}`,
        {
          items: (current.items || []).map((x) => ({
            mealName: x.mealName,
            deliveredCount:
              x.deliveredCount === "" ? 0 : Number(x.deliveredCount),
          })),
        },
        {
          params: { menuId },
          headers: { "x-auth-token": token },
        },
      );

      await load();
    } catch (err) {
      console.error(err);
      setError("Грешка при запис.");
    } finally {
      setSavingDay(null);
    }
  }

  if (!menuId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="mt-2 text-slate-600">
              Отвори URL като:{" "}
              <code className="rounded bg-slate-100 px-2 py-1 text-sm text-slate-800">
                /verify-count?menuId=...
              </code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen">
      <SidebarNav user={user} />

      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-10">
          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
              <div className="font-semibold">Възникна проблем</div>
              <div className="mt-1 text-sm text-rose-800">{error}</div>
            </div>
          )}

          <div className="mt-6 grid gap-4">
            {dayMap.map((d) => {
              const totalExpected = (d.items || []).reduce(
                (s, x) => s + (Number(x.expectedCount) || 0),
                0,
              );

              const totalDelivered = (d.items || []).reduce((s, x) => {
                const v =
                  x.deliveredCount === "" ? null : Number(x.deliveredCount);
                return s + (v ?? 0);
              }, 0);

              const anyEmpty = (d.items || []).some(
                (x) => x.deliveredCount === "",
              );
              const totalDiff = anyEmpty
                ? null
                : totalDelivered - totalExpected;

              const diffColor =
                totalDiff === null || totalDiff === 0
                  ? "text-slate-800"
                  : totalDiff < 0
                    ? "text-rose-700"
                    : "text-emerald-700";

              return (
                <section
                  key={d.day}
                  className="rounded-2xl border bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {d.day}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                        <span>
                          Очаквани:{" "}
                          <b className="text-slate-900">{totalExpected}</b>
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>
                          Доставени:{" "}
                          <b className="text-slate-900">{totalDelivered}</b>
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>
                          Разлика:{" "}
                          <b className={diffColor}>
                            {totalDiff === null ? "—" : totalDiff}
                          </b>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => saveDay(d.day)}
                      disabled={savingDay === d.day}
                      className={[
                        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm",
                        "bg-[#478BAF] text-white hover:bg-[#519bc3] transition-colors duration-300",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                      ].join(" ")}
                    >
                      {savingDay === d.day ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Запис…
                        </>
                      ) : (
                        "Запази доставени"
                      )}
                    </button>
                  </div>

                  <div className="px-5 py-4">
                    {d.items.length === 0 ? (
                      <div className="rounded-xl border border-dashed bg-slate-50 p-6 text-center">
                        <div className="text-sm font-semibold text-slate-900">
                          Няма поръчки за този ден
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          Ако очакваш данни, провери menuId и зареди отново.
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                  Артикул
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                  Очаквани
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                  Доставени
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                  Разлика
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {d.items.map((x) => {
                                const deliveredNum =
                                  x.deliveredCount === ""
                                    ? null
                                    : Number(x.deliveredCount);
                                const diff =
                                  deliveredNum === null
                                    ? null
                                    : deliveredNum - x.expectedCount;

                                const rowDiffColor =
                                  diff === null || diff === 0
                                    ? "text-slate-700"
                                    : diff < 0
                                      ? "text-rose-700"
                                      : "text-emerald-700";

                                return (
                                  <tr
                                    key={x.mealName}
                                    className="hover:bg-slate-50/70"
                                  >
                                    <td className="px-4 py-3">
                                      <div className="truncate font-medium text-slate-900">
                                        {x.mealName}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm text-slate-700">
                                      {x.expectedCount}
                                    </td>
                                    <td className="px-4 py-3">
                                      <input
                                        type="number"
                                        min="0"
                                        inputMode="numeric"
                                        value={x.deliveredCount}
                                        onChange={(e) =>
                                          updateDelivered(
                                            d.day,
                                            x.mealName,
                                            e.target.value,
                                          )
                                        }
                                        className={[
                                          "w-28 rounded-lg border px-3 py-2 text-sm",
                                          "bg-white text-slate-900 shadow-sm",
                                          "focus:outline-none focus:ring-2 focus:ring-slate-900/20",
                                        ].join(" ")}
                                      />
                                    </td>
                                    <td
                                      className={`px-4 py-3 font-mono text-sm ${rowDiffColor}`}
                                    >
                                      {diff === null ? "—" : diff}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
