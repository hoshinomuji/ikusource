-- Migration script to make password optional for OAuth users
-- Run this SQL script in your PostgreSQL database

-- Make password column optional (allow NULL)
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;

-- Verify the change
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'password';

