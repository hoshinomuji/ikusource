-- Add slip_verifications table to prevent duplicate slip usage
CREATE TABLE IF NOT EXISTS slip_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_hash TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    rdcw_response TEXT,
    reference_id TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index on file_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_slip_verifications_file_hash ON slip_verifications(file_hash);
CREATE INDEX IF NOT EXISTS idx_slip_verifications_user_id ON slip_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_slip_verifications_created_at ON slip_verifications(created_at);

