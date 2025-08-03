CREATE TABLE live_sessions (
    id SERIAL PRIMARY KEY,
    seller_id UUID NOT NULL,
    title VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active',
    'ended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);