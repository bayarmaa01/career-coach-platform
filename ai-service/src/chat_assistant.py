"""
AI Chat Career Assistant - ChatGPT-like career coaching service
Provides intelligent career advice, job suggestions, and interview help
"""

import logging
import json
import time
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from pydantic import BaseModel, Field
from .gemini_client import GeminiClient
from .fallback_handler import FallbackHandler
from .metrics import AIMetrics

logger = logging.getLogger(__name__)

class ChatMessage(BaseModel):
    """Chat message model"""
    role: str = Field(..., description="User or assistant")
    content: str = Field(..., description="Message content")
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    """Request model for chat"""
    message: str = Field(..., description="User message")
    user_profile: Optional[Dict[str, Any]] = Field(None, description="User profile data")
    conversation_id: Optional[str] = Field(None, description="Conversation ID for context")

class ChatResponse(BaseModel):
    """Response model for chat"""
    success: bool
    response: str
    conversation_id: str
    suggestions: Optional[List[str]] = None
    error: Optional[str] = None

class ChatAssistant:
    """AI Chat Career Assistant"""
    
    def __init__(self):
        self.gemini_client = GeminiClient()
        self.fallback_handler = FallbackHandler()
        self.metrics = AIMetrics()
        self.conversation_memory = {}  # Store last 5 messages per user
    
    def chat(self, request: ChatRequest) -> ChatResponse:
        """Process chat message and generate AI response"""
        start_time = time.time()
        
        try:
            logger.info(f"Processing chat message: {request.message[:50]}...")
            
            # Get conversation history
            conversation_id = request.conversation_id or self._generate_conversation_id()
            history = self._get_conversation_history(conversation_id)
            
            # Generate AI response
            ai_response = self._generate_chat_response(request.message, request.user_profile, history)
            
            # Update conversation history
            self._update_conversation_history(conversation_id, request.message, ai_response)
            
            # Extract suggestions from response
            suggestions = self._extract_suggestions(ai_response)
            
            # Record success metrics
            self.metrics.record_ai_request("chat", "success", time.time() - start_time)
            
            logger.info(f"Chat response generated successfully")
            
            return ChatResponse(
                success=True,
                response=ai_response,
                conversation_id=conversation_id,
                suggestions=suggestions
            )
            
        except Exception as e:
            logger.error(f"Chat processing failed: {str(e)}")
            
            # Record failure metrics
            self.metrics.record_ai_request("chat", "error", time.time() - start_time)
            
            # Try fallback
            try:
                fallback_response = self.fallback_handler.chat_fallback(request.message)
                return ChatResponse(
                    success=True,
                    response=fallback_response["response"],
                    conversation_id=request.conversation_id or self._generate_conversation_id(),
                    suggestions=fallback_response.get("suggestions", []),
                    error="Used fallback mode due to AI service unavailability"
                )
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {str(fallback_error)}")
                return ChatResponse(
                    success=False,
                    response="I'm sorry, I'm having trouble responding right now. Please try again later.",
                    conversation_id=request.conversation_id or self._generate_conversation_id(),
                    error=f"Chat processing failed: {str(e)}"
                )
    
    def _generate_conversation_id(self) -> str:
        """Generate unique conversation ID"""
        import uuid
        return str(uuid.uuid4())[:8]
    
    def _get_conversation_history(self, conversation_id: str) -> List[ChatMessage]:
        """Get conversation history (last 5 messages)"""
        return self.conversation_memory.get(conversation_id, [])
    
    def _update_conversation_history(self, conversation_id: str, user_message: str, ai_response: str):
        """Update conversation history (keep only last 5 messages)"""
        import time
        
        if conversation_id not in self.conversation_memory:
            self.conversation_memory[conversation_id] = []
        
        history = self.conversation_memory[conversation_id]
        
        # Add user message
        history.append(ChatMessage(
            role="user",
            content=user_message,
            timestamp=str(int(time.time()))
        ))
        
        # Add AI response
        history.append(ChatMessage(
            role="assistant",
            content=ai_response,
            timestamp=str(int(time.time()))
        ))
        
        # Keep only last 5 messages (user + assistant pairs)
        if len(history) > 10:  # 5 pairs = 10 messages
            self.conversation_memory[conversation_id] = history[-10:]
    
    def _generate_chat_response(self, message: str, user_profile: Optional[Dict[str, Any]], history: List[ChatMessage]) -> str:
        """Generate AI response for chat message"""
        
        # Create context-aware prompt
        prompt = self._create_chat_prompt(message, user_profile, history)
        
        # Get AI response
        ai_response = self.gemini_client.generate_content(prompt)
        
        return ai_response
    
    def _create_chat_prompt(self, message: str, user_profile: Optional[Dict[str, Any]], history: List[ChatMessage]) -> str:
        """Create comprehensive prompt for chat"""
        
        prompt = """
        You are an expert career coach and AI assistant. You help users with career advice, job searching, resume improvement, interview preparation, and professional development.
        
        Your tone should be:
        - Professional yet friendly and encouraging
        - Actionable and practical
        - Knowledgeable about current job market trends
        - Supportive and motivational
        
        You can help with:
        - Career path planning and guidance
        - Job search strategies
        - Resume and CV improvement
        - Interview preparation and mock questions
        - Skill development recommendations
        - Salary negotiation advice
        - Professional networking tips
        - Industry insights and trends
        
        """
        
        # Add user profile context if available
        if user_profile:
            prompt += f"""
            USER PROFILE:
            Name: {user_profile.get('name', 'Not provided')}
            Skills: {', '.join(user_profile.get('skills', []))}
            Experience: {user_profile.get('experience_summary', 'Not provided')}
            Education: {user_profile.get('education_summary', 'Not provided')}
            Target Role: {user_profile.get('target_role', 'Not provided')}
            
            """
        
        # Add conversation history for context
        if history:
            prompt += "CONVERSATION HISTORY:\n"
            for msg in history[-6:]:  # Last 3 exchanges
                prompt += f"{msg.role.upper()}: {msg.content}\n"
            prompt += "\n"
        
        # Add current message
        prompt += f"CURRENT USER MESSAGE: {message}\n\n"
        
        prompt += """
        Please provide a helpful, detailed response. If relevant, include:
        - Specific actionable advice
        - Examples or scenarios
        - Questions to help the user think deeper
        - Resources or next steps
        
        Keep your response conversational but professional. End with 1-2 relevant suggestions or follow-up questions.
        """
        
        return prompt
    
    def _extract_suggestions(self, response: str) -> List[str]:
        """Extract suggestions from AI response"""
        suggestions = []
        
        # Look for numbered lists or bullet points that might be suggestions
        lines = response.split('\n')
        for line in lines:
            line = line.strip()
            # Look for suggestion patterns
            if (line.startswith(('1.', '2.', '3.', '4.', '5.')) or
                line.startswith(('- ', '· ', '* ')) or
                line.lower().startswith(('suggestion:', 'recommendation:', 'next step:'))):
                # Clean up the suggestion
                suggestion = line.lstrip('12345.·-* ').strip()
                if suggestion and len(suggestion) > 10:  # Filter out very short lines
                    suggestions.append(suggestion)
        
        # Limit to top 5 suggestions
        return suggestions[:5]
    
    def get_conversation_history(self, conversation_id: str) -> List[ChatMessage]:
        """Get full conversation history for a user"""
        return self.conversation_memory.get(conversation_id, [])
    
    def clear_conversation_history(self, conversation_id: str):
        """Clear conversation history for a user"""
        if conversation_id in self.conversation_memory:
            del self.conversation_memory[conversation_id]
