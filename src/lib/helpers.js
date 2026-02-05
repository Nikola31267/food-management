import { uuid } from "@/lib/uuid";

export const formatDateForInput = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateTimeForInput = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const toISO = (localDateTimeOrDate) =>
  new Date(localDateTimeOrDate).toISOString();

export const addMeal = (days, dayIndex) => {
  const copy = structuredClone(days);
  copy[dayIndex].meals.push({
    id: uuid(),
    name: "",
    weight: "",
    price: "",
  });
  return copy;
};

export const removeMeal = (days, dayIndex, mealId) => {
  const copy = structuredClone(days);

  copy[dayIndex].meals = copy[dayIndex].meals.filter((m) => m.id !== mealId);

  return copy;
};

export const handleMealChange = (days, dayIndex, mealId, field, value) => {
  const copy = structuredClone(days);

  const day = copy[dayIndex];
  if (!day) return copy;

  const idx = day.meals.findIndex((m) => m.id === mealId);
  if (idx === -1) return copy;

  day.meals[idx] = { ...day.meals[idx], [field]: value };
  return copy;
};

export const addEditMeal = (editForm, dayIndex) => {
  const copy = structuredClone(editForm);

  if (!copy.days?.[dayIndex]) return copy;

  copy.days[dayIndex].meals.push({
    id: crypto.randomUUID(),
    name: "",
    weight: "",
    price: "",
  });

  return copy;
};

export const removeEditMeal = (editForm, dayIndex, mealId) => {
  const copy = structuredClone(editForm);
  if (!copy.days?.[dayIndex]) return copy;

  copy.days[dayIndex].meals = copy.days[dayIndex].meals.filter(
    (m) => m.id !== mealId,
  );

  return copy;
};

export const handleEditMealChange = (
  editForm,
  dayIndex,
  mealId,
  field,
  value,
) => {
  const copy = structuredClone(editForm);

  const day = copy.days?.[dayIndex];
  if (!day) return copy;

  const idx = day.meals.findIndex((m) => m.id === mealId);
  if (idx === -1) return copy;

  day.meals[idx] = { ...day.meals[idx], [field]: value };
  return copy;
};

export const formatDate = (date) => new Date(date).toISOString().split("T")[0];
