CREATE TABLE session_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    sender_id UUID NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text',
    'product')),
    content TEXT,
    product_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);