/**
 * MessageBubble Component (Legacy Wrapper)
 * 
 * This file now serves as a wrapper to maintain backward compatibility
 * while using the refactored MessageBubble component from the features/chat directory.
 * 
 * All message bubble logic has been moved to the vertical slice architecture.
 */

'use client';

import { MessageBubble } from '@/features/chat';

export default MessageBubble;