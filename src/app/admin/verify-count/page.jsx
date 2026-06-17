"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Loader from "@/components/layout/Loader";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { useRouter } from "next/navigation";

const DAYS = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const weekKey = (weekStart, weekEnd) => `${weekStart}__${weekEnd}`;

export default function DailyOrdersPage() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [savingDay, setSavingDay] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [user, setUser] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/auth/user");
        setUser(response.data);

        if (response.data.role !== "admin") {
          router.push("/dashboard");
        }
      } catch (error) {
        setError("Error fetching user profile");
        console.error(error);
        router.push("/sign-in");
      } finally {
        setPageLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const { data } = await axios.get("/api/archived-orders");

        const weekMap = new Map();

        data.data.forEach((student) => {
          student.archivedOrders.forEach((order) => {
            const key = weekKey(order.weekStart, order.weekEnd);

            if (!weekMap.has(key)) {
              weekMap.set(key, {
                key,
                weekStart: order.weekStart,
                weekEnd: order.weekEnd,
                label: `${formatDate(order.weekStart)} → ${formatDate(
                  order.weekEnd
                )}`,
              });
            }
          });
        });

        const sorted = [...weekMap.values()].sort(
          (a, b) => new Date(b.weekStart) - new Date(a.weekStart)
        );

        setWeeks(sorted);

        if (sorted.length > 0) {
          setSelectedWeek(sorted[0].key);
        }
      } catch (err) {
        console.error(err);
        setError("Грешка при зареждане на седмиците.");
      }
    };

    fetchWeeks();
  }, []);

  async function load() {
    if (!selectedWeek) return;

    const [weekStart, weekEnd] = selectedWeek.split("__");

    try {
      setLoadingData(true);
      setError("");

      const res = await axios.get("/api/verify-count-archived", {
        params: { weekStart, weekEnd },
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
      setLoadingData(false);
    }
  }

  useEffect(() => {
    load();
  }, [selectedWeek]);

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
                x.mealName === mealName
                  ? { ...x, deliveredCount: value }
                  : x
              ),
            }
      )
    );
  }

  async function saveDay(day) {
    if (!selectedWeek) return;

    const [weekStart] = selectedWeek.split("__");

    setSavingDay(day);
    setError("");

    try {
      const current = dayMap.find((d) => d.day === day);

      await axios.put(
        `/api/verify-count-archived/${encodeURIComponent(day)}`,
        {
          items: (current.items || []).map((x) => ({
            mealName: x.mealName,
            deliveredCount:
              x.deliveredCount === "" ? 0 : Number(x.deliveredCount),
          })),
        },
        { params: { weekStart } }
      );

      await load();
    } catch (err) {
      console.error(err);
      setError("Грешка при запис.");
    } finally {
      setSavingDay(null);
    }
  }

  if (pageLoading) return <Loader />;

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
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Проверка на доставени поръчки
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Изберете седмица и въведете реално доставените количества.
            </p>
          </div>

          <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Изберете седмица
            </label>

            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="
                w-full rounded-full border bg-white p-3
                outline-none
                focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]
                sm:w-auto
              "
            >
              <option value="">-- Изберете седмица --</option>
              {weeks.map((w) => (
                <option key={w.key} value={w.key}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
              <div className="font-semibold">Възникна проблем</div>
              <div className="mt-1 text-sm text-rose-800">{error}</div>
            </div>
          )}

          {!selectedWeek ? (
            <div className="rounded-2xl border border-dashed bg-white p-8 text-center shadow-sm sm:p-12">
              <p className="text-sm text-slate-500 sm:text-base">
                Изберете седмица, за да видите поръчките.
              </p>
            </div>
          ) : loadingData ? (
            <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#478BAF]" />
              <p className="text-sm text-slate-500">Зареждане...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {dayMap.map((d) => {
                const totalExpected = (d.items || []).reduce(
                  (s, x) => s + (Number(x.expectedCount) || 0),
                  0
                );

                const totalDelivered = (d.items || []).reduce((s, x) => {
                  const v =
                    x.deliveredCount === "" ? null : Number(x.deliveredCount);
                  return s + (v ?? 0);
                }, 0);

                const anyEmpty = (d.items || []).some(
                  (x) => x.deliveredCount === ""
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
                    className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                  >
                    <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {d.day}
                        </h3>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1 sm:text-left">
                          <div className="rounded-xl bg-slate-50 p-2 sm:bg-transparent sm:p-0">
                            <p className="text-xs text-slate-500 sm:hidden">
                              Очаквани
                            </p>
                            <span className="hidden text-slate-600 sm:inline">
                              Очаквани:{" "}
                            </span>
                            <b className="text-slate-900">{totalExpected}</b>
                          </div>

                          <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

                          <div className="rounded-xl bg-slate-50 p-2 sm:bg-transparent sm:p-0">
                            <p className="text-xs text-slate-500 sm:hidden">
                              Доставени
                            </p>
                            <span className="hidden text-slate-600 sm:inline">
                              Доставени:{" "}
                            </span>
                            <b className="text-slate-900">{totalDelivered}</b>
                          </div>

                          <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

                          <div className="rounded-xl bg-slate-50 p-2 sm:bg-transparent sm:p-0">
                            <p className="text-xs text-slate-500 sm:hidden">
                              Разлика
                            </p>
                            <span className="hidden text-slate-600 sm:inline">
                              Разлика:{" "}
                            </span>
                            <b className={diffColor}>
                              {totalDiff === null ? "—" : totalDiff}
                            </b>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => saveDay(d.day)}
                        disabled={savingDay === d.day}
                        className="
                          inline-flex w-full items-center justify-center gap-2
                          rounded-xl bg-[#478BAF] px-4 py-3 text-sm font-semibold
                          text-white shadow-sm transition-colors duration-300
                          hover:bg-[#519bc3]
                          disabled:cursor-not-allowed disabled:opacity-60
                          sm:w-auto sm:py-2
                        "
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

                    <div className="p-4 sm:p-5">
                      {d.items.length === 0 ? (
                        <div className="rounded-xl border border-dashed bg-slate-50 p-6 text-center">
                          <div className="text-sm font-semibold text-slate-900">
                            Няма поръчки за този ден
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Mobile cards */}
                          <div className="space-y-3 md:hidden">
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
                                <div
                                  key={x.mealName}
                                  className="rounded-xl border bg-white p-4 shadow-sm"
                                >
                                  <div className="mb-4">
                                    <p className="font-medium text-slate-900">
                                      {x.mealName}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg bg-slate-50 p-3">
                                      <p className="text-xs text-slate-500">
                                        Очаквани
                                      </p>
                                      <p className="mt-1 font-mono text-sm font-semibold text-slate-900">
                                        {x.expectedCount}
                                      </p>
                                    </div>

                                    <div className="rounded-lg bg-slate-50 p-3">
                                      <p className="text-xs text-slate-500">
                                        Разлика
                                      </p>
                                      <p
                                        className={`mt-1 font-mono text-sm font-semibold ${rowDiffColor}`}
                                      >
                                        {diff === null ? "—" : diff}
                                      </p>
                                    </div>

                                    <div className="col-span-2">
                                      <label className="mb-1 block text-xs text-slate-500">
                                        Доставени
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        inputMode="numeric"
                                        value={x.deliveredCount}
                                        onChange={(e) =>
                                          updateDelivered(
                                            d.day,
                                            x.mealName,
                                            e.target.value
                                          )
                                        }
                                        className="
                                          w-full rounded-lg border bg-white px-3 py-3
                                          text-sm text-slate-900 shadow-sm
                                          outline-none
                                          focus:ring-2 focus:ring-[#478BAF]
                                        "
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Desktop table */}
                          <div className="hidden overflow-hidden rounded-xl border md:block">
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[700px] border-collapse">
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
                                                e.target.value
                                              )
                                            }
                                            className="
                                              w-28 rounded-lg border bg-white px-3 py-2
                                              text-sm text-slate-900 shadow-sm
                                              outline-none
                                              focus:ring-2 focus:ring-[#478BAF]
                                            "
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
                        </>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}