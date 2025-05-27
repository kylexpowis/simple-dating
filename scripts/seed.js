// File: scripts/seed.js
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DUMMY = [
  {
    email: "alice@example.com",
    firstName: "Alice",
    age: 27,
    location: { city: "London", country: "UK" },
    ethnicities: ["Asian", "White"],
    relationshipType: "Long-term",
    hasKids: false,
    wantsKids: true,
    religion: "None",
    alcohol: "Socially",
    cigarettes: "Never",
    weed: "Often",
    drugs: "Never",
    bio: "Hi, I'm Alice!",
    imageUrls: [
      "https://img.buzzfeed.com/buzzfeed-static/static/2019-10/21/13/asset/bca59df568fc/sub-buzz-4034-1571664623-1.jpg",
      "https://i.redd.it/kylies-ig-baddie-era-v0-39tjk8f90skc1.jpg?width=1200&format=pjpg&auto=webp&s=265fbd3d6e87c9ea5cea0c61b2d46dcb5f20fb0a",
    ],
  },
  {
    email: "beth@example.com",
    firstName: "Beth",
    age: 30,
    location: { city: "Manchester", country: "UK" },
    ethnicities: ["Black"],
    relationshipType: "Long-term",
    hasKids: true,
    wantsKids: false,
    religion: "Christian",
    alcohol: "Never",
    cigarettes: "Socially",
    weed: "Never",
    drugs: "Never",
    bio: "Hey there—Beth here!",
    imageUrls: [
      "https://i.redd.it/how-do-i-achieve-the-ig-baddie-aesthetic-pls-drop-your-best-v0-8pjv85ei5hya1.jpg?width=1170&format=pjpg&auto=webp&s=65f4401350e38bd73a294defbf8e86893dd93c28",
    ],
  },
  {
    email: "chloe@example.com",
    firstName: "Chloe",
    age: 24,
    location: { city: "Birmingham", country: "UK" },
    ethnicities: ["Hispanic"],
    relationshipType: "Friends",
    hasKids: false,
    wantsKids: true,
    religion: "Buddhist",
    alcohol: "Never",
    cigarettes: "Never",
    weed: "Socially",
    drugs: "Never",
    bio: "Zen and the art of friendship.",
    imageUrls: [
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg",
    ],
  },
  {
    email: "diana@example.com",
    firstName: "Diana",
    age: 35,
    location: { city: "Leeds", country: "UK" },
    ethnicities: ["White"],
    relationshipType: "Long-term",
    hasKids: true,
    wantsKids: true,
    religion: "None",
    alcohol: "Socially",
    cigarettes: "Often",
    weed: "Never",
    drugs: "Never",
    bio: "Ready for adventure.",
    imageUrls: [
      "https://images.pexels.com/photos/3863793/pexels-photo-3863793.jpeg",
    ],
  },
  {
    email: "emma@example.com",
    firstName: "Emma",
    age: 29,
    location: { city: "Glasgow", country: "UK" },
    ethnicities: ["Mixed"],
    relationshipType: "Long-term",
    hasKids: false,
    wantsKids: false,
    religion: "None",
    alcohol: "Socially",
    cigarettes: "Never",
    weed: "Often",
    drugs: "Never",
    bio: "Coffee lover ☕",
    imageUrls: [
      "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg",
    ],
  },
];

async function seed() {
  try {
    // --- 1) Upsert all users by email ---
    const userPayload = DUMMY.map((u) => ({
      email: u.email,
      first_name: u.firstName,
      age: u.age,
      city: u.location.city,
      country: u.location.country,
      bio: u.bio,
      ethnicities: u.ethnicities,
      relationship: u.relationshipType,
      has_kids: u.hasKids,
      wants_kids: u.wantsKids,
      religion: u.religion,
      alcohol: u.alcohol,
      cigarettes: u.cigarettes,
      weed: u.weed,
      drugs: u.drugs,
    }));

    const { error: userError } = await supabase
      .from("users")
      .upsert(userPayload, { onConflict: ["email"] });
    if (userError) throw userError;
    console.log(`Upserted ${userPayload.length} users.`);

    // --- 2) Re-fetch to get their real UUIDs ---
    const { data: users, error: fetchErr } = await supabase
      .from("users")
      .select("id,email");
    if (fetchErr) throw fetchErr;

    const emailToId = users.reduce((acc, u) => {
      acc[u.email] = u.id;
      return acc;
    }, {});

    // --- 3) Build image records with the correct user_id ---
    const imagesPayload = [];
    DUMMY.forEach((u) => {
      const uid = emailToId[u.email];
      if (!uid) return;
      u.imageUrls.slice(0, 6).forEach((url) => {
        imagesPayload.push({
          user_id: uid,
          url,
        });
      });
    });

    // --- 4) Upsert (or insert) those images ---
    // We’ll just insert new ones; if you want idempotency you'll need a unique key—
    // e.g. add a UNIQUE(url, user_id) constraint and then use upsert().
    const { error: imgError } = await supabase
      .from("user_images")
      .upsert(imagesPayload, { onConflict: ["user_id", "url"] });
    if (imgError) throw imgError;
    console.log(`Upserted ${imagesPayload.length} images.`);

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    process.exit();
  }
}

seed();
