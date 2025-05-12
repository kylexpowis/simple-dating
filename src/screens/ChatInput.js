async function sendMessage(text) {
  const { error } = await supabase
    .from("messages")
    .insert([{ sender_id: meId, receiver_id: otherUserId, content: text }]);

  if (error) console.error("Error sending message:", error);
}
