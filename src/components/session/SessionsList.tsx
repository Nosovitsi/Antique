import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SessionListItem } from './SessionListItem';
import { Search, Plus, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// --- ИНТЕРФЕЙСЫ ВЫНЕСЕНЫ В НАЧАЛО ФАЙЛА ДЛЯ ДОСТУПНОСТИ ---

// Тип для LiveSession
interface LiveSession {
  id: number;
  title: string;
  status: 'active' | 'ended';
  seller_id: string;
  created_at: string;
  ended_at: string | null;
}

// Тип для SessionMessage
interface SessionMessage {
  id: number;
  session_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'product';
  created_at: string;
  product_id?: number;
}

// Тип для Product
interface Product {
  id: number;
  name: string;
  // Добавьте другие свойства, если они есть
}

const API_BASE_URL = 'http://127.0.0.1:5174';

interface SessionsListProps {
  onJoinSession: (sessionId: number) => void;
  onCreateSession?: () => void;
}

// Тип SessionWithDetails теперь корректно расширяет LiveSession
interface SessionWithDetails extends LiveSession {
  seller_name: string;
  participant_count: number;
  last_message?: {
    content: string | null;
    message_type: string;
    created_at: string;
    product_name?: string;
  };
}

// --- КОМПОНЕНТ НАЧИНАЕТСЯ ПОСЛЕ ОБЪЯВЛЕНИЯ ИНТЕРФЕЙСОВ ---
export function SessionsList({ onJoinSession, onCreateSession }: SessionsListProps) {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoading(true);
      
      const sessionsResponse = await fetch(`${API_BASE_URL}/live_sessions`);
      if (!sessionsResponse.ok) throw new Error('Failed to fetch sessions');
      const sessionsData: LiveSession[] = await sessionsResponse.json();

      if (sessionsData && sessionsData.length > 0) {
        const sellerIds = [...new Set(sessionsData.map(s => s.seller_id))];
        const profilesPromises = sellerIds.map(id => fetch(`${API_BASE_URL}/auth/profile/${id}`).then(res => res.json()));
        const profiles = await Promise.all(profilesPromises);

        const sessionsWithDetailsPromises = sessionsData.map(async (session) => {
          const messagesResponse = await fetch(`${API_BASE_URL}/messages/${session.id}`);
          const messages: SessionMessage[] = messagesResponse.ok ? await messagesResponse.json() : [];

          const lastMsg = messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

          let product: Product | undefined;
          if (lastMsg?.product_id) {
            const productResponse = await fetch(`${API_BASE_URL}/products?id=${lastMsg.product_id}`);
            const productData = productResponse.ok ? await productResponse.json() : [];
            product = productData[0];
          }

          const uniqueSenders = new Set(messages.map(m => m.sender_id));
          const participant_count = uniqueSenders.size;
          
          return {
            ...session,
            seller_name: profiles.find(p => p.user_id === session.seller_id)?.full_name || 'Unknown Seller',
            participant_count,
            last_message: lastMsg ? {
              content: lastMsg.content,
              message_type: lastMsg.message_type,
              created_at: lastMsg.created_at,
              product_name: product?.name
            } : undefined
          };
        });

        const sessionsWithDetails = await Promise.all(sessionsWithDetailsPromises);

        const sortedSessions = sessionsWithDetails.sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (b.status === 'active' && a.status !== 'active') return 1;
          
          const aTime = a.last_message?.created_at || a.created_at;
          const bTime = b.last_message?.created_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        setSessions(sortedSessions);
      } else {
        setSessions([]);
      }
    } catch (error: any) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = (session.title?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
                         (session.seller_name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || session.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageCircle className="h-7 w-7 mr-2 text-purple-600" />
            Live Sessions
          </h1>
          {profile?.role === 'seller' && onCreateSession && (
            <button
              onClick={onCreateSession}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex space-x-2">
          {['all', 'active', 'ended'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as 'all' | 'active' | 'ended')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === filterOption
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              {filterOption === 'active' && (
                <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {sessions.filter(s => s.status === 'active').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SessionListItem
                  session={session}
                  onClick={() => onJoinSession(session.id)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filter !== 'all' ? 'No sessions found' : 'No live sessions yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Be the first to start a live shopping session!'}
            </p>
            {profile?.role === 'seller' && onCreateSession && (
              <button
                onClick={onCreateSession}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Start Your First Session
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
