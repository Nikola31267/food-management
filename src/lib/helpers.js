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

export const addMeal = (dayIndex) => {
  const copy = structuredClone(form.days);
  copy[dayIndex].meals.push({
    id: crypto.randomUUID(),
    name: "",
    weight: "",
    price: "",
  });
  setForm({ ...form, days: copy });
};

export const removeMeal = (dayIndex, mealId) => {
  const copy = structuredClone(form.days);
  copy[dayIndex].meals = copy[dayIndex].meals.filter((m) => m.id !== mealId);
  setForm({ ...form, days: copy });
};

export const handleMealChange = (dayIndex, mealId, field, value) => {
  const copy = structuredClone(form.days);
  const idx = copy[dayIndex].meals.findIndex((m) => m.id === mealId);
  if (idx === -1) return;
  copy[dayIndex].meals[idx][field] = value;
  setForm({ ...form, days: copy });
};

export const addEditMeal = (dayIndex) => {
  const copy = structuredClone(editForm);
  copy.days[dayIndex].meals.push({
    id: crypto.randomUUID(),
    name: "",
    weight: "",
    price: "",
  });
  setEditForm(copy);
};

export const removeEditMeal = (dayIndex, mealId) => {
  const copy = structuredClone(editForm);
  copy.days[dayIndex].meals = copy.days[dayIndex].meals.filter(
    (m) => m.id !== mealId,
  );
  setEditForm(copy);
};

export const handleEditMealChange = (dayIndex, mealId, field, value) => {
  const copy = structuredClone(editForm);
  const idx = copy.days[dayIndex].meals.findIndex((m) => m.id === mealId);
  if (idx === -1) return;
  copy.days[dayIndex].meals[idx][field] = value;
  setEditForm(copy);
};

export const formatDate = (date) => new Date(date).toISOString().split("T")[0];
