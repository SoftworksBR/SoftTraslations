
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { sendPublicMessage } from '@/services/publicAssistantService';

const colors = {
  navy: '#0B2239',
  teal: '#087F8C',
  tealDark: '#066773',
  tealSoft: '#E8F6F7',
  ink: '#172B3A',
  muted: '#627485',
  line: '#DFE7EC',
  canvas: '#F5F8FA',
  white: '#FFFFFF',
  green: '#20845A',
};

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
}

const suggestions = [
  'Quero solicitar um orçamento',
  'Quais idiomas vocês traduzem?',
  'Quais serviços estão disponíveis?',
];

export function PublicAssistant() {
  const { width, height } = useWindowDimensions();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text:
        'Olá! Sou o assistente da SoftTranslations. Posso ajudar você a conhecer nossos serviços, idiomas e solicitar uma estimativa de tradução.',
    },
  ]);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const isMobile = width < 640;

  const chatWidth = isMobile ? Math.max(0, width - 24) : 380;
  const chatHeight = Math.max(
    300,
    Math.min(height - 40, isMobile ? 680 : 560)
  );

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [messages, loading, isOpen]);

  async function handleSend(text?: string) {
    const content = (text ?? message).trim();

    if (!content || loading) return;

    setMessage('');
    Keyboard.dismiss();

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      sender: 'user',
      text: content,
    };

    setMessages((previous) => [...previous, userMessage]);
    setLoading(true);

    try {
      const result = await sendPublicMessage(content, sessionId);

      setSessionId(result.session_id);

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-assistant`,
          sender: 'assistant',
          text: result.response || 'Não consegui gerar uma resposta. Pode tentar novamente?',
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-error`,
          sender: 'assistant',
          text:
            error instanceof Error
              ? `Não consegui me conectar ao atendimento: ${error.message}`
              : 'Ocorreu um erro ao enviar sua mensagem.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    Keyboard.dismiss();
    setIsOpen(false);
  }

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {isOpen ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.window,
            {
              width: chatWidth,
              height: chatHeight,
              right: 12,
              bottom: isMobile ? 12 : 88,
            },
            isMobile && styles.mobileWindow,
          ]}
        >
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="language-outline" size={23} color={colors.teal} />
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>
                Assistente SoftTranslations
              </Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.headerSubtitle}>
                  Atendimento virtual
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Minimizar assistente"
              onPress={handleClose}
              style={styles.headerButton}
            >
              <Ionicons name="remove" size={22} color={colors.white} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar assistente"
              onPress={handleClose}
              style={styles.headerButton}
            >
              <Ionicons name="close" size={21} color={colors.white} />
            </Pressable>
          </View>

          {/* Conversa */}
          <ScrollView
            ref={scrollRef}
            style={styles.messageArea}
            contentContainerStyle={styles.messageContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.welcomeArea}>
              <View style={styles.botIcon}>
                <Ionicons name="sparkles" size={23} color={colors.teal} />
              </View>
              <Text style={styles.welcomeTitle}>
                Olá! Como podemos ajudar?
              </Text>
              <Text style={styles.welcomeDescription}>
                Tire suas dúvidas e descubra nossos serviços de tradução.
              </Text>
            </View>

            {messages.map((item) => {
              const isUser = item.sender === 'user';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.messageRow,
                    isUser && styles.userMessageRow,
                  ]}
                >
                  {!isUser && (
                    <View style={styles.smallBotIcon}>
                      <Ionicons
                        name="sparkles"
                        size={14}
                        color={colors.teal}
                      />
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      isUser
                        ? styles.userBubble
                        : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isUser && styles.userMessageText,
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            })}

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.teal} />
                <Text style={styles.loadingText}>
                  Preparando resposta...
                </Text>
              </View>
            )}

            {messages.length === 1 && (
              <View style={styles.suggestionsArea}>
                <Text style={styles.suggestionsTitle}>
                  Sugestões para começar
                </Text>

                {suggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    disabled={loading}
                    onPress={() => handleSend(suggestion)}
                    style={({ pressed }) => [
                      styles.suggestionButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.suggestionText}>
                      {suggestion}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={15}
                      color={colors.teal}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Campo de mensagem */}
          <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                value={message}
                onChangeText={setMessage}
                placeholder="Digite sua mensagem..."
                placeholderTextColor="#91A0AD"
                style={styles.input}
                multiline={false}
                maxLength={4000}
                editable={!loading}
                returnKeyType="send"
                onSubmitEditing={() => handleSend()}
                accessibilityLabel="Mensagem para o assistente"
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enviar mensagem"
                disabled={!message.trim() || loading}
                onPress={() => handleSend()}
                style={[
                  styles.sendButton,
                  (!message.trim() || loading) && styles.sendDisabled,
                ]}
              >
                <Ionicons name="send" size={18} color={colors.white} />
              </Pressable>
            </View>

            <Text style={styles.footerText}>
              SoftTranslations • Assistente virtual
            </Text>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir assistente SoftTranslations"
          onPress={() => setIsOpen(true)}
          style={({ pressed }) => [
            styles.floatingButton,
            pressed && styles.floatingButtonPressed,
          ]}
        >
          <Ionicons name="chatbubble-ellipses" size={27} color={colors.white} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
    elevation: 8,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  floatingButtonPressed: {
    backgroundColor: colors.tealDark,
    transform: [{ scale: 0.96 }],
  },
  window: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 17,
    backgroundColor: colors.white,
    elevation: 12,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
  },
  mobileWindow: {
    borderRadius: 18,
  },
  header: {
    minHeight: 70,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.teal,
  },
  headerIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  onlineIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#9BE6B9',
  },
  headerSubtitle: {
    color: '#E1F7F8',
    fontSize: 10,
  },
  headerButton: {
    width: 29,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  messageContent: {
    padding: 15,
    paddingBottom: 20,
    gap: 13,
  },
  welcomeArea: {
    alignItems: 'center',
    paddingVertical: 9,
    gap: 5,
  },
  botIcon: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  welcomeTitle: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  welcomeDescription: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    maxWidth: '94%',
  },
  userMessageRow: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  smallBotIcon: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 13,
    maxWidth: '100%',
  },
  assistantBubble: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 3,
  },
  userBubble: {
    backgroundColor: colors.teal,
    borderBottomRightRadius: 3,
  },
  messageText: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 19,
  },
  userMessageText: {
    color: colors.white,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 32,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 11,
  },
  suggestionsArea: {
    gap: 8,
    marginTop: 4,
  },
  suggestionsTitle: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  suggestionButton: {
    minHeight: 39,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 7,
    borderWidth: 1,
    borderColor: '#B8DDE0',
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  suggestionText: {
    flex: 1,
    color: colors.tealDark,
    fontSize: 11,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  inputArea: {
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  inputContainer: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 13,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    minHeight: 42,
    paddingVertical: 9,
    color: colors.ink,
    fontSize: 12,
    outlineStyle: 'none',
  } as any,
  sendButton: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: colors.teal,
  },
  sendDisabled: {
    opacity: 0.4,
  },
  footerText: {
    marginTop: 7,
    color: '#91A0AD',
    fontSize: 9,
    textAlign: 'center',
  },
});