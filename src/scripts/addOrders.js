import mongoose from "mongoose";
import User from "../models/User.js"; // <-- adjust path

const MONGODB_URI = "";
const MENU_ID = "69850f0e8d91da0b1e24e64e";

if (!MONGODB_URI) throw new Error("Missing MONGODB_URI env var");
if (!MENU_ID) throw new Error("Missing MENU_ID env var");

// keep this helper from your script
function priceToNumber(v) {
  if (v == null) return undefined;
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

const ordersToInsert = [
  {
    fullName: "Кристиан Илиев",
    grade: "12Г",
    totalPrice: 20.5,
    days: [
      {
        day: "Понеделник",
        meals: [
          {
            mealName: "Пилешко филе с къри и шафранов ориз",
            quantity: 1,
            price: priceToNumber("5.20"),
          },
        ],
      },
      {
        day: "Вторник",
        meals: [
          {
            mealName: "Пилешко филе с гриловани зеленчуци",
            quantity: 1,
            price: priceToNumber("5.20"),
          },
        ],
      },
      {
        day: "Сряда",
        meals: [
          {
            mealName:
              "Задушени хапки от свинско месо с карамелизиран лук и картофено пюре",
            quantity: 1,
            price: priceToNumber("4.90"),
          },
        ],
      },
      {
        day: "Четвъртък",
        meals: [
          {
            mealName: "Оризови спагети с пиле и зеленчуци",
            quantity: 1,
            price: priceToNumber("5.20"),
          },
        ],
      },
    ],
  },

  {
    fullName: "Димана Вътева",
    grade: "12Г",
    totalPrice: 26.9,
    days: [
      {
        day: "Понеделник",
        meals: [
          {
            mealName: "Пилешко филе с къри и шафранов ориз",
            quantity: 1,
            price: priceToNumber("5.20"),
          },
          {
            mealName: "Мляко с ориз",
            quantity: 1,
            price: priceToNumber("2.00"),
          },
        ],
      },
      {
        day: "Вторник",
        meals: [
          {
            mealName: "Пилешко филе с гриловани зеленчуци",
            quantity: 1,
            price: priceToNumber("5.20"),
          },
        ],
      },
      {
        day: "Сряда",
        meals: [
          {
            mealName:
              "Задушени хапки от свинско месо с карамелизиран лук и картофено пюре",
            quantity: 1,
            price: priceToNumber("4.90"),
          },
        ],
      },
      {
        day: "Четвъртък",
        meals: [
          {
            mealName: "Джолан от свинско месо на фурна",
            quantity: 1,
            price: priceToNumber("4.40"),
          },
        ],
      },
      {
        day: "Петък",
        meals: [
          {
            mealName: "Телешко месо със спанак и ориз",
            quantity: 1,
            price: priceToNumber("5.20"),
          },
        ],
      },
    ],
  },

  {
    fullName: "Филип Паулетто",
    grade: "12Г",
    totalPrice: 33.8,
    days: [
      {
        day: "Понеделник",
        meals: [
          {
            mealName: "Гулаш с телешко месо",
            quantity: 1,
            price: priceToNumber("5.20"),
          },
        ],
      },
      {
        day: "Вторник",
        meals: [
          {
            mealName: "Пилешко филе с гриловани зеленчуци",
            quantity: 1,
            price: priceToNumber("5.20"),
          },
        ],
      },
      {
        day: "Сряда",
        meals: [
          {
            mealName: "Крем супа от броколи с чедър",
            quantity: 1,
            price: priceToNumber("2.70"),
          },
          {
            mealName:
              "Задушени хапки от свинско месо с карамелизиран лук и картофено пюре",
            quantity: 1,
            price: priceToNumber("4.90"),
          },
        ],
      },
      {
        day: "Четвъртък",
        meals: [
          {
            mealName: "Крем супа от зеленчуци с ементал",
            quantity: 1,
            price: priceToNumber("2.70"),
          },
          {
            mealName: "Оризови спагети с пиле и зеленчуци",
            quantity: 1,
            price: priceToNumber("5.20"),
          },
        ],
      },
      {
        day: "Петък",
        meals: [
          {
            mealName: "Крем супа от картофи със сирене",
            quantity: 1,
            price: priceToNumber("2.70"),
          },
          {
            mealName: "Тиквички пълнени с киноа и кашкавал",
            quantity: 1,
            price: priceToNumber("4.40"),
          },
        ],
      },
    ],
  },

  {
    fullName: "Мариела Гроздева",
    grade: "12Г",
    totalPrice: 36.9,
    days: [
      {
        day: "Понеделник",
        meals: [
          {
            mealName: "Супа от пиле застроена",
            quantity: 1,
            price: priceToNumber("3.00"),
          },
          {
            mealName: "Пилешко филе с къри и шафранов ориз",
            quantity: 1,
            price: priceToNumber("5.20"),
          },
        ],
      },
      {
        day: "Вторник",
        meals: [
          {
            mealName: "Гювеч с телешко месо",
            quantity: 1,
            price: priceToNumber("5.20"),
          },
          {
            mealName: "Цедено мляко със сладко от боровинки",
            quantity: 1,
            price: priceToNumber("2.70"),
          },
        ],
      },
      {
        day: "Сряда",
        meals: [
          {
            mealName:
              "Задушени хапки от свинско месо с карамелизиран лук и картофено пюре",
            quantity: 1,
            price: priceToNumber("4.90"),
          },
          {
            mealName: "Домашен течен шоколад Наслада",
            quantity: 1,
            price: priceToNumber("2.50"),
          },
        ],
      },
      {
        day: "Четвъртък",
        meals: [
          {
            mealName: "Снежанка малка",
            quantity: 1,
            price: priceToNumber("2.50"),
          },
          {
            mealName: "Гръцка мусака",
            quantity: 1,
            price: priceToNumber("4.60"),
          },
        ],
      },
      {
        day: "Петък",
        meals: [
          {
            mealName: "Салата Капрезе",
            quantity: 1,
            price: priceToNumber("3.30"),
          },
          {
            mealName: "Супа от пиле застроена",
            quantity: 1,
            price: priceToNumber("3.00"),
          },
        ],
      },
    ],
  },
];
async function main() {
  await mongoose.connect(MONGODB_URI);
  const menuId = new mongoose.Types.ObjectId(MENU_ID);

  let updated = 0;
  let notFound = 0;

  for (const entry of ordersToInsert) {
    const user = await User.findOne({
      fullName: entry.fullName,
      grade: entry.grade,
    });

    if (!user) {
      console.warn(
        `❌ User not found: "${entry.fullName}" grade "${entry.grade}"`,
      );
      notFound++;
      continue;
    }

    user.orders.push({
      menuId,
      days: entry.days,
      totalPrice: entry.totalPrice, // ✅ already calculated & inserted
      paid: false,
      createdAt: new Date(),
    });

    await user.save();
    console.log(
      `✅ Added order for ${entry.fullName} (${entry.grade}) total=${entry.totalPrice.toFixed(2)}`,
    );
    updated++;
  }

  console.log("\n--- Summary ---");
  console.log(`Updated users: ${updated}`);
  console.log(`Not found: ${notFound}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
