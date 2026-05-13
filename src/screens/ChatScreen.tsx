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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { chatService, ChatMessage } from '../services/chatService';
import { StatusBar } from 'expo-status-bar';

const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const { activeTrip, markChatAsRead } = useTrip();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (activeTrip?.id) {
        markChatAsRead();
      }
    }, [activeTrip?.id])
  );

  useEffect(() => {
    if (!activeTrip?.id || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const unsubscribe = chatService.subscribeToMessages(activeTrip.id, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    }, (error: any) => {
      if (error.code !== 'permission-denied') {
        console.error("Chat error:", error);
      }
    });

    return () => unsubscribe();
  }, [activeTrip?.id, user]);

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

  const renderMessage = ({ item, index }: { item: ChatMessage, index: number }) => {
    const isMe = item.userId === user?.uid;
    
    // Lógica para agrupar mensajes (FlatList inverted)
    const prevMessage = index + 1 < messages.length ? messages[index + 1] : null;
    const nextMessage = index - 1 >= 0 ? messages[index - 1] : null;

    const isFirstInBlock = !prevMessage || prevMessage.userId !== item.userId;
    const isLastInBlock = !nextMessage || nextMessage.userId !== item.userId;

    return (
      <View style={[
        styles.messageWrapper, 
        isMe ? styles.myMessageWrapper : styles.otherMessageWrapper,
        { marginBottom: isLastInBlock ? 16 : 4 }
      ]}>
        {!isMe && (
          <View style={styles.avatarContainer}>
            {isLastInBlock ? (
              item.userPhoto ? (
                <Image source={{ uri: item.userPhoto }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {item.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )
            ) : (
              <View style={{ width: 32 }} />
            )}
          </View>
        )}

        <View style={[styles.messageContent, { alignItems: isMe ? 'flex-end' : 'flex-start' }]}>
          {(!isMe && isFirstInBlock) && (
            <Text style={[styles.senderName, { color: colors.textSecondary }]}>{item.userName}</Text>
          )}
          
          <View style={[
            styles.bubble,
            isMe ? { backgroundColor: colors.primary } : { backgroundColor: isDark ? '#2C2C2E' : '#E9E9EB' },
            !isMe && !isFirstInBlock && { borderTopLeftRadius: 5 },
            isMe && !isFirstInBlock && { borderTopRightRadius: 5 }
          ]}>
            <Text style={[styles.messageText, { color: isMe ? '#fff' : colors.text }]}>
              {item.text}
              <Text style={styles.timePlaceholder}> {'          '} </Text> 
            </Text>
            
            <View style={styles.timeContainerInside}>
              <Text style={[styles.timeTextInside, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
                {item.createdAt?.toDate ? 
                  new Date(item.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                  '...'}
              </Text>
            </View>
          </View>
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
        <View style={[
          styles.inputArea,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12) + 10 // Subir un poco más como pidió el usuario
          }
        ]}>
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
    maxWidth: '80%',
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
    // Eliminado padding manual para que se alinee con la base
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: 'bold' },
  messageContent: {
    // Quitamos flex: 1 para que no ocupe todo el ancho
  },
  senderName: { fontSize: 11, fontWeight: '600', marginBottom: 4, marginLeft: 12 },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '100%', // El máximo ya lo da el messageWrapper (80%)
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  timePlaceholder: { fontSize: 10 },
  timeContainerInside: {
    position: 'absolute',
    right: 8,
    bottom: 4,
  },
  timeTextInside: {
    fontSize: 10,
  },
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
