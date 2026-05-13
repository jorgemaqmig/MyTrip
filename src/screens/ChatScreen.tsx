import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { chatService, ChatMessage } from '../services/chatService';
import { StatusBar } from 'expo-status-bar';

const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const { activeTrip } = useTrip();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!activeTrip?.id) return;

    const unsubscribe = chatService.subscribeToMessages(activeTrip.id, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTrip?.id]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeTrip?.id || !user) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      await chatService.sendMessage(activeTrip.id, {
        text: textToSend,
        userId: user.uid,
        userName: user.displayName || 'Viajero',
        userPhoto: user.photoURL || undefined
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.userId === user?.uid;

    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
        {!isMe && (
          <View style={styles.avatarContainer}>
            {item.userPhoto ? (
              <Image source={{ uri: item.userPhoto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {item.userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.messageContent}>
          {!isMe && <Text style={[styles.senderName, { color: colors.textSecondary }]}>{item.userName}</Text>}
          <View style={[
            styles.bubble,
            isMe ? { backgroundColor: colors.primary } : { backgroundColor: isDark ? '#2C2C2E' : '#E9E9EB' }
          ]}>
            <Text style={[styles.messageText, { color: isMe ? '#fff' : colors.text }]}>
              {item.text}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: colors.textSecondary, textAlign: isMe ? 'right' : 'left' }]}>
            {item.createdAt?.toDate ? 
              new Date(item.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
              'Enviando...'}
          </Text>
        </View>
      </View>
    );
  };

  if (!activeTrip) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Selecciona un viaje para chatear</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View style={styles.flexOne}>
            <Text style={[styles.title, { color: colors.text }]}>Chat</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{activeTrip.name}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
            onPress={() => navigation.navigate('Mapa')}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id!}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            inverted
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input Area */}
        <View style={[styles.inputArea, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.textSecondary + '40' }]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexOne: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerSection: { padding: 24, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  closeButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  messagesList: { padding: 20 },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: 'bold' },
  messageContent: { flex: 1 },
  senderName: { fontSize: 11, fontWeight: '600', marginBottom: 4, marginLeft: 12 },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  timeText: { fontSize: 10, marginTop: 4, marginHorizontal: 8 },
  inputArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default ChatScreen;
