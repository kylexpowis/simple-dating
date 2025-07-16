// This seed file is to push dummy data only.
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DUMMY = [
  {
    email: "alice@example.com",
    first_name: "Alice",
    age: 27,
    city: "London",
    country: "UK",
    ethnicities: ["Asian", "White"],
    relationship: "Long-term",
    has_kids: false,
    wants_kids: true,
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
    first_name: "Beth",
    age: 30,
    city: "Manchester",
    country: "UK",
    ethnicities: ["Black"],
    relationship: "Long-term",
    has_kids: true,
    wants_kids: false,
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
    first_name: "Chloe",
    age: 24,
    city: "Birmingham",
    country: "UK",
    ethnicities: ["Hispanic"],
    relationship: "Friends",
    has_kids: false,
    wants_kids: true,
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
    first_name: "Diana",
    age: 35,
    city: "Leeds",
    country: "UK",
    ethnicities: ["White"],
    relationship: "Long-term",
    has_kids: true,
    wants_kids: true,
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
    first_name: "Emma",
    age: 29,
    city: "Glasgow",
    country: "UK",
    ethnicities: ["Mixed"],
    relationship: "Long-term",
    has_kids: false,
    wants_kids: false,
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
    // 2) Bulk-insert users, skipping any duplicate emails
    const usersPayload = DUMMY.map((u) => ({
      email: u.email,
      first_name: u.first_name,
      age: u.age,
      city: u.city,
      country: u.country,
      ethnicities: u.ethnicities,
      relationship: u.relationship,
      has_kids: u.has_kids,
      wants_kids: u.wants_kids,
      religion: u.religion,
      alcohol: u.alcohol,
      cigarettes: u.cigarettes,
      weed: u.weed,
      drugs: u.drugs,
      bio: u.bio,
    }));
    const { error: userError } = await supabase
      .from("users")
      .insert(usersPayload, {
        ignoreDuplicates: true,
        returning: "minimal",
      });
    if (userError) throw userError;

    // 3) Grab back all the user IDs for our dummy emails
    const emails = DUMMY.map((u) => u.email);
    const { data: allUsers, error: fetchError } = await supabase
      .from("users")
      .select("id, email")
      .in("email", emails);
    if (fetchError) throw fetchError;

    const idMap = allUsers.reduce((map, u) => {
      map[u.email] = u.id;
      return map;
    }, {});

    // 4) Prepare the images payload
    const imagesPayload = [];
    DUMMY.forEach((u) => {
      const user_id = idMap[u.email];
      if (!user_id) return;
      u.imageUrls.forEach((url) => {
        imagesPayload.push({ user_id, url });
      });
    });

    // 5) Bulk-insert images, skipping duplicates on your unique index (user_id,url)
    if (imagesPayload.length) {
      const { error: imgError, count } = await supabase
        .from("user_images")
        .insert(imagesPayload, {
          ignoreDuplicates: true,
          returning: "minimal",
        });
      if (imgError) throw imgError;
      console.log(`Inserted ${count} new images (duplicates skipped).`);
    }

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seed failed:", {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

seed();
