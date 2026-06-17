"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import {
  formatDateForInput,
  formatDateTimeForInput,
  toISO,
  addMeal,
  removeMeal,
  handleMealChange,
  addEditMeal,
  removeEditMeal,
  handleEditMealChange,
  formatDate,
} from "@/lib/helpers";
import { parseMenuFromRows } from "@/lib/excell-read-functions";
import { uuid } from "@/lib/uuid";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { parseWeekFromMenuFilename } from "@/lib/helpers";

const DAYS = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

const AdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState("");
  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [submiting, setSubmiting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [menuCsvText, setMenuCsvText] = useState("");
  const [menuCsvName, setMenuCsvName] = useState("");

  const router = useRouter();

  const [form, setForm] = useState({
    weekStart: "",
    weekEnd: "",
    orderDeadline: "",
    days: DAYS.map((d) => ({ day: d, meals: [] })),
  });

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await axios.get("/api/auth/user");

        if (userRes.data.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        setUser(userRes.data);
        await fetchMenu();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const hasAnyMeals = useMemo(
    () => form.days.some((d) => d.meals && d.meals.length > 0),
    [form.days],
  );

  const fetchMenu = async () => {
    const res = await axios.get("/api/menu");
    setWeeklyMenu(res.data?.days ? res.data : null);
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Please upload an .xlsx file.");
      return;
    }

    try {
      const weekInfo = parseWeekFromMenuFilename(file.name);

      if (weekInfo) {
        setForm((prev) => ({
          ...prev,
          weekStart: weekInfo.weekStart,
          weekEnd: weekInfo.weekEnd,
        }));
      }

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        blankrows: false,
      });

      const parsed = parseMenuFromRows(rows).map((d) => ({
        day: d.day,
        meals: d.meals.map((m) => ({
          id: uuid(),
          name: m.name,
          weight: m.weight,
          price: m.price == null ? "" : String(m.price),
        })),
      }));

      setForm((prev) => ({ ...prev, days: parsed }));

      const csvText = XLSX.utils.sheet_to_csv(sheet, {
        FS: ",",
        RS: "\r\n",
        blankrows: false,
      });

      setMenuCsvText(csvText);

      if (weekInfo?.normalizedBaseName) {
        setMenuCsvName(`${weekInfo.normalizedBaseName}.csv`);
      } else {
        const baseName = file.name.replace(/\.xlsx$/i, "");
        setMenuCsvName(`${baseName}.csv`);
      }

      toast.success("Менюто е заредено от Excel");
    } catch (err) {
      console.error(err);
      toast.error("Failed to read XLSX file.");
    }
  };

  const handleSubmit = async () => {
    if (!form.orderDeadline) {
      toast.error("Please set an order deadline");
      return;
    }

    if (!hasAnyMeals) {
      toast.error("Добавете поне едно ястие");
      return;
    }

    const payload = {
      weekStart: toISO(form.weekStart),
      weekEnd: toISO(form.weekEnd),
      orderDeadline: toISO(form.orderDeadline),
      days: form.days.map((d) => ({
        day: d.day,
        meals: (d.meals || [])
          .filter((m) => String(m.name || "").trim())
          .map((m) => ({
            name: String(m.name || "").trim(),
            weight: String(m.weight || "").trim(),
            price:
              m.price === "" || m.price == null
                ? null
                : Number(String(m.price).replace(",", ".")),
          })),
      })),
      menuFile: menuCsvText || "",
      menuFileName: menuCsvName || "",
    };

    setSubmiting(true);

    try {
      await axios.post("/api/menu", payload);

      toast.success("Менюто е създадено!");
      await fetchMenu();

      setForm({
        weekStart: "",
        weekEnd: "",
        orderDeadline: "",
        days: DAYS.map((d) => ({ day: d, meals: [] })),
      });

      setMenuCsvText("");
      setMenuCsvName("");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to save menu");
    } finally {
      setSubmiting(false);
    }
  };

  const startEditing = () => {
    const copy = JSON.parse(JSON.stringify(weeklyMenu));

    copy.weekStart = formatDateForInput(copy.weekStart);
    copy.weekEnd = formatDateForInput(copy.weekEnd);
    copy.orderDeadline = formatDateTimeForInput(copy.orderDeadline);

    copy.days = copy.days.map((d) => ({
      ...d,
      meals: (d.meals || []).map((m) => ({
        ...m,
        id: m.id || uuid(),
      })),
    }));

    setEditForm(copy);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditForm(null);
    setIsEditing(false);
  };

  const saveEdits = async () => {
    try {
      setSubmiting(true);

      const payload = {
        ...editForm,
        weekStart: toISO(editForm.weekStart),
        weekEnd: toISO(editForm.weekEnd),
        orderDeadline: toISO(editForm.orderDeadline),
        days: editForm.days.map((d) => ({
          day: d.day,
          meals: (d.meals || [])
            .filter((m) => String(m.name || "").trim())
            .map((m) => ({
              name: String(m.name || "").trim(),
              weight: String(m.weight || "").trim(),
              price:
                m.price === "" || m.price == null
                  ? null
                  : Number(String(m.price).replace(",", ".")),
            })),
        })),
      };

      await axios.put(`/api/menu/${weeklyMenu._id}`, payload);

      toast.success("Менюто е редактирано!");
      setIsEditing(false);
      await fetchMenu();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to update menu");
    } finally {
      setSubmiting(false);
    }
  };

  const deleteMenu = async () => {
    const firstConfirm = window.confirm("Изтрийте цялото седмично меню?");
    if (!firstConfirm) return;

    setSubmiting(true);

    try {
      const downloadOrders = window.confirm(
        "Искате ли да свалите всички стари поръчки преди изтриване?",
      );

      const response = await axios.delete(
        `/api/menu/${weeklyMenu._id}?download=${downloadOrders}`,
        { responseType: downloadOrders ? "blob" : "json" },
      );

      if (downloadOrders) {
        const startDate = formatDate(weeklyMenu.weekStart);
        const endDate = formatDate(weeklyMenu.weekEnd);

        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-${startDate}_to_${endDate}.csv`;
        a.click();

        window.URL.revokeObjectURL(url);
      }

      setWeeklyMenu(null);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to delete menu");
    } finally {
      setSubmiting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav user={user} />

      <main className="min-h-screen transition-all duration-300 md:pl-[var(--sidebar-width,16rem)]">
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="space-y-6 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold sm:text-xl">
                Създай седмично меню
              </h2>

              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm transition-colors duration-300 hover:border-[#478BAF] hover:bg-gray-50 sm:w-auto">
                <span className="font-medium">Upload .xlsx</span>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={onFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="font-semibold">От:</p>
                <div className="w-full rounded-lg border border-gray-300 focus-within:border-[#478BAF] focus-within:ring-2 focus-within:ring-[#478BAF]">
                  <input
                    type="date"
                    className="w-full rounded-lg border-none bg-transparent px-3 py-2 focus:outline-none"
                    value={form.weekStart}
                    onChange={(e) =>
                      setForm({ ...form, weekStart: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-semibold">До:</p>
                <div className="w-full rounded-lg border border-gray-300 focus-within:border-[#478BAF] focus-within:ring-2 focus-within:ring-[#478BAF]">
                  <input
                    type="date"
                    className="w-full rounded-lg border-none bg-transparent px-3 py-2 focus:outline-none"
                    value={form.weekEnd}
                    onChange={(e) =>
                      setForm({ ...form, weekEnd: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Последен ден за поръчка:</p>
              <div className="w-full rounded-lg border border-gray-300 focus-within:border-[#478BAF] focus-within:ring-2 focus-within:ring-[#478BAF]">
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border-none bg-transparent px-3 py-2 focus:outline-none"
                  value={form.orderDeadline}
                  onChange={(e) =>
                    setForm({ ...form, orderDeadline: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              {form.days.map((day, dayIndex) => (
                <div key={day.day} className="rounded-xl border p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-bold">{day.day}</h3>

                    <Button
                      variant="outline"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          days: addMeal(prev.days, dayIndex),
                        }))
                      }
                      className="w-full transition-colors duration-300 hover:border-[#478BAF] hover:bg-gray-50 sm:w-auto"
                    >
                      + Добави ястие
                    </Button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {day.meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px_140px_auto] sm:items-center"
                      >
                        <input
                          className="w-full rounded-lg border px-3 py-2 focus:border-[#478BAF] focus:outline-none focus:ring-2 focus:ring-[#478BAF]"
                          placeholder="Име на ястието"
                          value={meal.name}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              days: handleMealChange(
                                prev.days,
                                dayIndex,
                                meal.id,
                                "name",
                                e.target.value,
                              ),
                            }))
                          }
                        />

                        <input
                          className="w-full rounded-lg border px-3 py-2 focus:border-[#478BAF] focus:outline-none focus:ring-2 focus:ring-[#478BAF]"
                          placeholder="Грамаж/Бройка"
                          value={meal.weight}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              days: handleMealChange(
                                prev.days,
                                dayIndex,
                                meal.id,
                                "weight",
                                e.target.value,
                              ),
                            }))
                          }
                        />

                        <div className="flex items-center gap-2">
                          <input
                            inputMode="decimal"
                            className="w-full rounded-lg border px-3 py-2 focus:border-[#478BAF] focus:outline-none focus:ring-2 focus:ring-[#478BAF]"
                            placeholder="Цена"
                            value={meal.price}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                days: handleMealChange(
                                  prev.days,
                                  dayIndex,
                                  meal.id,
                                  "price",
                                  e.target.value,
                                ),
                              }))
                            }
                          />

                          <span className="shrink-0 text-sm text-gray-600">
                            €
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              days: removeMeal(prev.days, dayIndex, meal.id),
                            }))
                          }
                          className="w-full transition-colors duration-300 hover:border-[#478BAF] hover:bg-gray-50 sm:w-auto"
                        >
                          −
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <ShinyButton
              href="#"
              disabled={submiting}
              className="w-full p-2 sm:w-auto"
              onClick={handleSubmit}
            >
              {submiting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <span>Създай</span>
              )}
            </ShinyButton>
          </div>

          {weeklyMenu && (
            <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold sm:text-xl">
                  Сегашно меню
                </h2>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {!isEditing && (
                    <Button
                      variant="outline"
                      className="w-full transition-colors duration-300 hover:border-[#478BAF] hover:bg-gray-50 sm:w-auto"
                      onClick={startEditing}
                    >
                      ✏️ Редактирай
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    disabled={submiting}
                    onClick={deleteMenu}
                    className="w-full sm:w-auto"
                  >
                    {submiting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <span>Изтрий</span>
                    )}
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="date"
                      className="w-full rounded-lg border px-3 py-2 focus:border-[#478BAF] focus:outline-none focus:ring-2 focus:ring-[#478BAF]"
                      value={editForm.weekStart}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          weekStart: e.target.value,
                        })
                      }
                    />

                    <input
                      type="date"
                      className="w-full rounded-lg border px-3 py-2 focus:border-[#478BAF] focus:outline-none focus:ring-2 focus:ring-[#478BAF]"
                      value={editForm.weekEnd}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          weekEnd: e.target.value,
                        })
                      }
                    />
                  </div>

                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border px-3 py-2 focus:border-[#478BAF] focus:outline-none focus:ring-2 focus:ring-[#478BAF]"
                    value={editForm.orderDeadline}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        orderDeadline: e.target.value,
                      })
                    }
                  />

                  <div className="space-y-4">
                    {editForm.days.map((day, dayIndex) => (
                      <div key={day.day} className="rounded-xl border p-3 sm:p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="font-bold">{day.day}</h3>

                          <Button
                            variant="outline"
                            onClick={() =>
                              setEditForm((prev) => addEditMeal(prev, dayIndex))
                            }
                            className="w-full transition-colors duration-300 hover:border-[#478BAF] hover:bg-gray-50 sm:w-auto"
                          >
                            + Добави ястие
                          </Button>
                        </div>

                        <div className="mt-3 space-y-3">
                          {day.meals.map((meal) => (
                            <div
                              key={meal.id}
                              className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px_140px_auto] sm:items-center"
                            >
                              <input
                                className="w-full rounded-lg border px-3 py-2 focus:border-[#478BAF] focus:outline-none focus:ring-2 focus:ring-[#478BAF]"
                                value={meal.name}
                                onChange={(e) =>
                                  setEditForm((prev) =>
                                    handleEditMealChange(
                                      prev,
                                      dayIndex,
                                      meal.id,
                                      "name",
                                      e.target.value,
                                    ),
                                  )
                                }
                                placeholder="Име на ястието"
                              />

                              <input
                                className="w-full rounded-lg border px-3 py-2 focus:border-[#478BAF] focus:outline-none focus:ring-2 focus:ring-[#478BAF]"
                                placeholder="Грамаж/Бройка"
                                value={meal.weight || ""}
                                onChange={(e) =>
                                  setEditForm((prev) =>
                                    handleEditMealChange(
                                      prev,
                                      dayIndex,
                                      meal.id,
                                      "weight",
                                      e.target.value,
                                    ),
                                  )
                                }
                              />

                              <div className="flex items-center gap-2">
                                <input
                                  inputMode="decimal"
                                  className="w-full rounded-lg border px-3 py-2 focus:border-[#478BAF] focus:outline-none focus:ring-2 focus:ring-[#478BAF]"
                                  value={meal.price ?? ""}
                                  onChange={(e) =>
                                    setEditForm((prev) =>
                                      handleEditMealChange(
                                        prev,
                                        dayIndex,
                                        meal.id,
                                        "price",
                                        e.target.value,
                                      ),
                                    )
                                  }
                                  placeholder="Цена"
                                />

                                <span className="shrink-0 text-sm text-gray-600">
                                  €
                                </span>
                              </div>

                              <Button
                                variant="outline"
                                onClick={() =>
                                  setEditForm((prev) =>
                                    removeEditMeal(prev, dayIndex, meal.id),
                                  )
                                }
                                className="w-full transition-colors duration-300 hover:border-[#478BAF] hover:bg-gray-50 sm:w-auto"
                              >
                                −
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <ShinyButton
                      href="#"
                      onClick={saveEdits}
                      className="w-full sm:w-auto"
                    >
                      {submiting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <span>Запази промените</span>
                      )}
                    </ShinyButton>

                    <Button
                      variant="outline"
                      onClick={cancelEditing}
                      className="w-full sm:w-auto"
                    >
                      Откажи
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600 sm:text-base">
                  {new Date(weeklyMenu.weekStart).toLocaleDateString()} –{" "}
                  {new Date(weeklyMenu.weekEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;