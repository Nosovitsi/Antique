CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    seller_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available',
    'reserved',
    'sold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);