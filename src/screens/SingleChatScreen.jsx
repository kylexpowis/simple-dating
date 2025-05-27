import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { supabase } from '../../Lib/supabase';
import { useRoute } from '@react-navigation/native';

export default function SingleChatScreen() {
  const route = useRoute();
  const { otherUser } = route.params;             // expect: { id, firstName, … }
  const [session, setSession]       = useState(null);
  const [me, setMe]                 = useState(null);
  const [messages, setMessages]     = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef                 = useRef();

  // 1) on mount: load session, history, subscribe
  useEffect(() => {
    let channel;
    (async () => {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      if (sessErr || !session) return console.error('No session', sessErr);
      setSession(session);
      setMe(session.user);

      // load history
      const { data: history, error: histErr } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${session.user.id},receiver_id.eq.${otherUser.id}),` +
          `and(sender_id.eq.${otherUser.id},receiver_id.eq.${session.user.id})`
        )
        .order('sent_at', { ascending: true });
      if (histErr) console.error('load history', histErr);
      else setMessages(history);

      // realtime subscription
      channel = supabase
        .channel(`chat_${session.user.id}_${otherUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            // only fires for our two‐way pair
            filter: `or(and(sender_id.eq.${session.user.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${session.user.id}))`
          },
          (msg) => {
            setMessages((prev) => [...prev, msg.new]);
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [otherUser.id]);

  // 2) send a new message
  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !me) return;
    const payload = {
      sender_id:   me.id,
      receiver_id: otherUser.id,
      content:     text,
      sent_at:     new Date().toISOString(),
    };
    // optimistically scroll
    setMessages((prev) => [...prev, payload]);
    flatListRef.current?.scrollToEnd({ animated: true });
    setNewMessage('');

    const { error: insertErr } = await supabase
      .from('messages')
      .insert([payload]);
    if (insertErr) console.error('save msg', insertErr);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id ?? `${item.sent_at}` }
        renderItem={({ item }) => {
          const isMe = me && item.sender_id === me.id;
          return (
            <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
              <Text style={styles.messageText}>{item.content}</Text>
            </View>
          );
        }}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message…"
        />
        <Button title="Send" onPress={handleSend} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#fff' },
  chatContent:   { padding: 16, paddingBottom: 0 },
  bubble:        {
    marginVertical: 4,
    padding:        10,
    borderRadius:   16,
    maxWidth:       '75%',
  },
  myBubble:      {
    alignSelf:     'flex-end',
    backgroundColor: '#DCF8C5',
  },
  theirBubble:   {
    alignSelf:     'flex-start',
    backgroundColor: '#ECECEC',
  },
  messageText:   { fontSize: 16, color: '#000' },
  inputRow:      {
    flexDirection: 'row',
    padding:       8,
    borderTopWidth: 1,
    borderColor:    '#ddd',
    alignItems:     'center',
  },
  input:         {
    flex:          1,
    borderWidth:   1,
    borderColor:   '#ccc',
    borderRadius:  20,
    paddingHorizontal: 12,
    paddingVertical:   8,
    marginRight:       8,
  },
});
