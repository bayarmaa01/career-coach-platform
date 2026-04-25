/**
 * Career Chat Page - AI-powered career assistant
 * ChatGPT-like interface for career advice and guidance
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Card,
  CardBody,
  Avatar,
  Spinner,
  useToast,
  Divider,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
  Flex,
  Badge,
  ScrollArea,
} from '@chakra-ui/react';
import { FaPaperPlane, FaUser, FaRobot, FaLightbulb } from 'react-icons/fa';
import { api } from '../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

interface UserProfile {
  name?: string;
  skills?: string[];
  experience?: string;
  target_role?: string;
}

const CareerChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    // Load user profile and conversation history
    loadUserProfile();
    loadConversationHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUserProfile = async () => {
    try {
      // Get user profile from localStorage or API
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const storedConversationId = localStorage.getItem('conversationId');
      if (storedConversationId) {
        setConversationId(storedConversationId);
        // Could load previous messages here if needed
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      const response = await api.post('/ai/chat', {
        message: userMessage.content,
        user_profile: userProfile,
        conversation_id: conversationId,
      });

      if (response.data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toISOString(),
          suggestions: response.data.suggestions || [],
        };

        setMessages(prev => [...prev, assistantMessage]);
        setConversationId(response.data.conversation_id);
        setSuggestions(response.data.suggestions || []);

        // Save conversation ID
        localStorage.setItem('conversationId', response.data.conversation_id);
      } else {
        throw new Error(response.data.error || 'Failed to get response');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        status: 'error',
        duration: 5000,
      });

      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again later.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const useSuggestion = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId('');
    setSuggestions([]);
    localStorage.removeItem('conversationId');
    toast({
      title: 'Chat Cleared',
      description: 'Your conversation has been cleared.',
      status: 'info',
      duration: 3000,
    });
  };

  const predefinedQuestions = [
    "What skills do I need for a software engineering job?",
    "How can I improve my resume?",
    "What are the best career paths for someone with programming skills?",
    "How do I prepare for a technical interview?",
    "What's the difference between frontend and backend development?",
    "How can I transition into a data science career?",
  ];

  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="stretch" h="calc(100vh - 200px)">
        <HStack justify="space-between" align="center">
          <Heading size="2xl">AI Career Assistant</Heading>
          <Button variant="outline" onClick={clearChat} size="sm">
            Clear Chat
          </Button>
        </HStack>

        <Card flex={1} display="flex" flexDirection="column">
          <CardBody p={0} display="flex" flexDirection="column" flex={1}>
            <ScrollArea flex={1} p={4}>
              <VStack spacing={4} align="stretch">
                {messages.length === 0 && (
                  <VStack spacing={4} py={8}>
                    <Avatar size="xl" icon={<FaRobot />} bg="blue.500" />
                    <Heading size="lg" textAlign="center">
                      Welcome to Your AI Career Assistant!
                    </Heading>
                    <Text textAlign="center" color="gray.600">
                      I'm here to help you with career advice, job searching, resume improvement, 
                      interview preparation, and professional development.
                    </Text>
                    
                    <VStack spacing={2} align="stretch" pt={4}>
                      <Text fontWeight="bold" textAlign="center">
                        Try asking me:
                      </Text>
                      {predefinedQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setInputMessage(question)}
                          textAlign="left"
                          whiteSpace="normal"
                          h="auto"
                          py={3}
                        >
                          {question}
                        </Button>
                      ))}
                    </VStack>
                  </VStack>
                )}

                {messages.map((message) => (
                  <HStack
                    key={message.id}
                    align="start"
                    spacing={4}
                    w="full"
                  >
                    <Avatar
                      size="md"
                      icon={message.role === 'user' ? <FaUser /> : <FaRobot />}
                      bg={message.role === 'user' ? 'green.500' : 'blue.500'}
                    />
                    <VStack align="start" spacing={2} flex={1}>
                      <HStack>
                        <Text fontWeight="bold" fontSize="sm">
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Text>
                      </HStack>
                      <Card bg={message.role === 'user' ? 'green.50' : 'blue.50'}>
                        <CardBody p={3}>
                          <Text whiteSpace="pre-wrap">{message.content}</Text>
                        </CardBody>
                      </Card>
                    </VStack>
                  </HStack>
                ))}

                {isLoading && (
                  <HStack align="start" spacing={4} w="full">
                    <Avatar size="md" icon={<FaRobot />} bg="blue.500" />
                    <Card bg="blue.50">
                      <CardBody p={3}>
                        <HStack spacing={2}>
                          <Spinner size="sm" />
                          <Text>Thinking...</Text>
                        </HStack>
                      </CardBody>
                    </Card>
                  </HStack>
                )}

                {suggestions.length > 0 && !isLoading && (
                  <VStack spacing={2} align="start">
                    <HStack>
                      <FaLightbulb color="gold" />
                      <Text fontWeight="bold" fontSize="sm">
                        Suggested follow-up questions:
                      </Text>
                    </HStack>
                    <Wrap spacing={2}>
                      {suggestions.map((suggestion, index) => (
                        <Badge
                          key={index}
                          colorScheme="blue"
                          cursor="pointer"
                          onClick={() => useSuggestion(suggestion)}
                          px={3}
                          py={1}
                          borderRadius="full"
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </Wrap>
                  </VStack>
                )}

                <div ref={messagesEndRef} />
              </VStack>
            </ScrollArea>

            <Divider />

            <VStack p={4} spacing={3}>
              <HStack spacing={2}>
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your career..."
                  disabled={isLoading}
                  flex={1}
                />
                <Tooltip label="Send message">
                  <IconButton
                    aria-label="Send message"
                    icon={<FaPaperPlane />}
                    onClick={sendMessage}
                    isLoading={isLoading}
                    disabled={!inputMessage.trim() || isLoading}
                    colorScheme="blue"
                  />
                </Tooltip>
              </HStack>
              
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Press Enter to send, Shift+Enter for new line
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default CareerChatPage;
