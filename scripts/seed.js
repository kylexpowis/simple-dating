// File: scripts/seed.js
// Supabase seed script for dummy users and their images (idempotent upsert)
// Images will have sequential IDs (1–n) without user_id column

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase with service_role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Dummy data: each user with up to 6 image URLs
const DUMMY = [
  {
    id: 1,
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
    bio: "",
    imageUrls: [
      "https://img.buzzfeed.com/buzzfeed-static/static/2019-10/21/13/asset/bca59df568fc/sub-buzz-4034-1571664623-1.jpg",
      "https://i.redd.it/kylies-ig-baddie-era-v0-39tjk8f90skc1.jpg?width=1200&format=pjpg&auto=webp&s=265fbd3d6e87c9ea5cea0c61b2d46dcb5f20fb0a",
    ],
  },
  {
    id: 2,
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
    bio: "",
    imageUrls: [
      "https://i.redd.it/how-do-i-achieve-the-ig-baddie-aesthetic-pls-drop-your-best-v0-8pjv85ei5hya1.jpg?width=1170&format=pjpg&auto=webp&s=65f4401350e38bd73a294defbf8e86893dd93c28",
    ],
  },
  {
    id: 3,
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
    bio: "",
    imageUrls: [
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg",
    ],
  },
  {
    id: 4,
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
    bio: "",
    imageUrls: [
      "https://images.pexels.com/photos/3863793/pexels-photo-3863793.jpeg",
    ],
  },
  {
    id: 5,
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
    bio: "",
    imageUrls: [
      "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg",
    ],
  },
];

async function seed() {
  try {
    // 1) Upsert users by primary key 'id'
    const userPayload = DUMMY.map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.firstName,
      age: u.age,
      city: u.location.city,
      country: u.location.country,
      bio: u.bio || null,
      ethnicities: u.ethnicities,
      relationship: u.relationshipType,
      has_kids: u.hasKids,
      wants_kids: u.wantsKids ? "yes" : "no",
      religion: u.religion,
      alcohol: u.alcohol,
      cigarettes: u.cigarettes,
      weed: u.weed,
      drugs: u.drugs,
    }));

    const { error: userError } = await supabase
      .from("users")
      .upsert(userPayload, { onConflict: ["id"] });
    if (userError) throw userError;
    console.log(`Upserted ${userPayload.length} users.`);

    // 2) Prepare image records sequentially (id: 1..n)
    const imagesPayload = [];
    DUMMY.forEach((u) => {
      u.imageUrls.slice(0, 6).forEach((url) => {
        imagesPayload.push({ url });
      });
    });
    // Assign sequential IDs starting at 1
    imagesPayload.forEach((img, idx) => {
      img.id = idx + 1;
    });

    // 3) Upsert images by primary key 'id'
    const { error: imgError } = await supabase
      .from("user_images")
      .upsert(imagesPayload, { onConflict: ["id"] });
    if (imgError) throw imgError;
    console.log(`Upserted ${imagesPayload.length} images.`);

    // Done. Idempotent seed: no duplicates, preserves IDs 1–n
  } catch (err) {
    console.error("Seed error:", err.message || err);
  } finally {
    process.exit();
  }
}

seed();
