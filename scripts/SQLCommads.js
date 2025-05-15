// Working SQL For Full Database (Without 1-6 constraint on images)

// -- 0) Ensure pgcrypto for gen_random_uuid()
// CREATE EXTENSION IF NOT EXISTS pgcrypto;

// -- 1) Users
// CREATE TABLE IF NOT EXISTS public.users (
//   id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
//   email        TEXT            NOT NULL UNIQUE,
//   first_name   TEXT,
//   age          INT,
//   city         TEXT,
//   country      TEXT,
//   gender       TEXT,
//   bio          TEXT,
//   ethnicities  TEXT[],
//   relationship TEXT,
//   has_kids     BOOLEAN,
//   wants_kids   TEXT,
//   religion     TEXT,
//   alcohol      TEXT,
//   weed         TEXT,
//   cigarettes   TEXT,
//   drugs        TEXT,
//   created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
//   updated_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
// );

// -- 2) User images
// CREATE TABLE IF NOT EXISTS public.user_images (
//   id          BIGSERIAL       PRIMARY KEY,
//   user_id     UUID            NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
//   url         TEXT            NOT NULL,
//   uploaded_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
// );

// -- 3) Matches
// DROP TABLE IF EXISTS public.matches;
// CREATE TABLE public.matches (
//   id         BIGSERIAL    PRIMARY KEY,
//   user_a     UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
//   user_b     UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
//   matched_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
// );
// /* prevent A⇄B duplicates */
// CREATE UNIQUE INDEX IF NOT EXISTS matches_unique_pair_idx
//   ON public.matches (
//     LEAST(user_a, user_b),
//     GREATEST(user_a, user_b)
//   );

// -- 4) Message requests (one free “ice-breaker” before match)
// CREATE TABLE IF NOT EXISTS public.message_requests (
//   id           BIGSERIAL    PRIMARY KEY,
//   sender_id    UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
//   receiver_id  UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
//   sent_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
//   accepted     BOOLEAN      NOT NULL DEFAULT FALSE,
//   accepted_at  TIMESTAMPTZ
// );
// /* only one request per pair+direction */
// CREATE UNIQUE INDEX IF NOT EXISTS msgreq_unique_idx
//   ON public.message_requests(sender_id, receiver_id);

// -- 5) Chats (conversations only after match)
// CREATE TABLE IF NOT EXISTS public.chats (
//   id         BIGSERIAL     PRIMARY KEY,
//   match_id   BIGINT        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
//   created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
// );

// -- 6) Messages
// CREATE TABLE IF NOT EXISTS public.messages (
//   id         BIGSERIAL     PRIMARY KEY,
//   chat_id    BIGINT        NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
//   sender_id  UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
//   content    TEXT          NOT NULL,
//   sent_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
// );

// -- 7) Blocks (directional block)
// CREATE TABLE IF NOT EXISTS public.blocks (
//   id           BIGSERIAL    PRIMARY KEY,
//   blocker_id   UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
//   blocked_id   UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
//   blocked_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
//   UNIQUE(blocker_id, blocked_id)
// );

// -- 8) Enable Row-Level Security and add basic policies
// --    so users can only see/modify their own rows:

// -- Users
// ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
// CREATE POLICY users_self_select
//   ON public.users FOR SELECT USING ( auth.uid() = id );
// CREATE POLICY users_self_modify
//   ON public.users FOR UPDATE USING ( auth.uid() = id );

// -- user_images
// ALTER TABLE public.user_images ENABLE ROW LEVEL SECURITY;
// CREATE POLICY ui_self_select
//   ON public.user_images FOR SELECT USING ( auth.uid() = user_id );
// CREATE POLICY ui_self_insert
//   ON public.user_images FOR INSERT WITH CHECK ( auth.uid() = user_id );
// CREATE POLICY ui_self_delete
//   ON public.user_images FOR DELETE USING ( auth.uid() = user_id );

// -- matches (so you can only see matches you’re part of)
// ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
// CREATE POLICY matches_self_select
//   ON public.matches FOR SELECT USING (
//     auth.uid() = user_a OR auth.uid() = user_b
//   );
// CREATE POLICY matches_self_insert
//   ON public.matches FOR INSERT WITH CHECK (
//     auth.uid() = user_a OR auth.uid() = user_b
//   );

// -- message_requests
// ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;
// CREATE POLICY mr_self_select
//   ON public.message_requests FOR SELECT USING (
//     auth.uid() = sender_id OR auth.uid() = receiver_id
//   );
// CREATE POLICY mr_self_insert
//   ON public.message_requests FOR INSERT WITH CHECK (
//     auth.uid() = sender_id
//   );
// CREATE POLICY mr_self_update
//   ON public.message_requests FOR UPDATE USING (
//     auth.uid() = receiver_id
//   );

// -- chats
// ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
// CREATE POLICY chats_self_select
//   ON public.chats FOR SELECT USING (
//     EXISTS (
//       SELECT 1 FROM public.matches m
//       WHERE m.id = chats.match_id
//         AND (auth.uid() = m.user_a OR auth.uid() = m.user_b)
//     )
//   );
// CREATE POLICY chats_self_insert
//   ON public.chats FOR INSERT WITH CHECK ( FALSE );  -- you only create via matching

// -- messages
// ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
// CREATE POLICY msg_self_select
//   ON public.messages FOR SELECT USING (
//     EXISTS (
//       SELECT 1 FROM public.chats c
//       JOIN public.matches m ON m.id = c.match_id
//       WHERE c.id = messages.chat_id
//         AND (auth.uid() = m.user_a OR auth.uid() = m.user_b)
//     )
//   );
// CREATE POLICY msg_self_insert
//   ON public.messages FOR INSERT WITH CHECK (
//     EXISTS (
//       SELECT 1 FROM public.chats c
//       JOIN public.matches m ON m.id = c.match_id
//       WHERE c.id = messages.chat_id
//         AND auth.uid() = messages.sender_id
//         AND (auth.uid() = m.user_a OR auth.uid() = m.user_b)
//     )
//   );

// -- blocks
// ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
// CREATE POLICY blocks_self_select
//   ON public.blocks FOR SELECT USING (
//     auth.uid() = blocker_id OR auth.uid() = blocked_id
//   );
// CREATE POLICY blocks_self_insert
//   ON public.blocks FOR INSERT WITH CHECK ( auth.uid() = blocker_id );

// ---------------------------- NEW SQL QUERY -------------------------------------------------------

// Working SQL to allow users to upload images by creating a policy on buckets
// -- 1) Enable RLS on the storage schema
// ALTER TABLE storage.buckets      ENABLE ROW LEVEL SECURITY;
// ALTER TABLE storage.objects      ENABLE ROW LEVEL SECURITY;

// -- 2) Let any logged-in user see the bucket itself
// CREATE POLICY buckets_select_authenticated
//   ON storage.buckets
//   FOR SELECT
//   USING ( auth.role() = 'authenticated' );

// -- 3) Let any logged-in user insert/select/update/delete objects in your bucket
// CREATE POLICY objects_insert_authenticated
//   ON storage.objects
//   FOR INSERT
//   WITH CHECK (
//     bucket_id = 'simple-dating-user-images'
//     AND auth.role() = 'authenticated'
//   );

// CREATE POLICY objects_select_authenticated
//   ON storage.objects
//   FOR SELECT
//   USING (
//     bucket_id = 'simple-dating-user-images'
//     AND auth.role() = 'authenticated'
//   );

// CREATE POLICY objects_update_authenticated
//   ON storage.objects
//   FOR UPDATE
//   USING (
//     bucket_id = 'simple-dating-user-images'
//     AND auth.role() = 'authenticated'
//   );

// CREATE POLICY objects_delete_authenticated
//   ON storage.objects
//   FOR DELETE
//   USING (
//     bucket_id = 'simple-dating-user-images'
//     AND auth.role() = 'authenticated'
//   );
