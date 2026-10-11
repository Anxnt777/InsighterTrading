-- InsighterTrading Database Initialization
-- Creates initial tables for watchlists, metadata, and audit logs.

CREATE TABLE IF NOT EXISTS watchlist_items (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(16) NOT NULL UNIQUE,
    company_name VARCHAR(128) NOT NULL,
    sector VARCHAR(64),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS stock_metadata_cache (
    symbol VARCHAR(16) PRIMARY KEY,
    company_name VARCHAR(128) NOT NULL,
    exchange VARCHAR(32),
    currency VARCHAR(8) DEFAULT 'USD',
    sector VARCHAR(64),
    industry VARCHAR(128),
    last_fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial popular assets for testing
INSERT INTO watchlist_items (symbol, company_name, sector)
VALUES 
    ('AAPL', 'Apple Inc.', 'Technology'),
    ('MSFT', 'Microsoft Corporation', 'Technology'),
    ('NVDA', 'NVIDIA Corporation', 'Semiconductors'),
    ('GOOGL', 'Alphabet Inc.', 'Communication Services')
ON CONFLICT (symbol) DO NOTHING;
