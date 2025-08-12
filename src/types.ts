// Этот файл содержит все интерфейсы, используемые в проекте, для централизованного управления типами.

// Тип для LiveSession, представляющий основные данные о сессии
export interface LiveSession {
  id: number;
  title: string;
  status: 'active' | 'ended';
  seller_id: string;
  created_at: string;
  ended_at: string | null;
}

// Тип для SessionMessage, представляющий сообщения внутри сессии
export interface SessionMessage {
  id: number;
  session_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'product';
  created_at: string;
  product_id?: number;
}

// Тип для Product, представляющий товар, который может быть связан с сообщением
export interface Product {
  id: number;
  name: string;
  // Добавьте другие свойства, если они есть
}

// Тип SessionsListProps для пропсов компонента SessionsList
export interface SessionsListProps {
  onJoinSession: (sessionId: number) => void;
  onCreateSession?: () => void;
}

// Тип SessionWithDetails расширяет LiveSession, добавляя дополнительные детали
export interface SessionWithDetails extends LiveSession {
  seller_name: string;
  participant_count: number;
  last_message?: {
    content: string | null;
    message_type: string;
    created_at: string;
    product_name?: string;
  };
}