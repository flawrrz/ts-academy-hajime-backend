-- 1. Date of Birth (store as actual DATE type)
ALTER TABLE users 
ADD COLUMN date_of_birth DATE 
CHECK (date_of_birth <= CURRENT_DATE);

-- 2. National Identification Number (NIN) - 11 digits, unique per user
ALTER TABLE users 
ADD COLUMN nin VARCHAR(11) UNIQUE 
CHECK (nin ~ '^[0-9]{11}$');

-- 3. Bank Verification Number (BVN) - 11 digits, unique per user
ALTER TABLE users 
ADD COLUMN bvn VARCHAR(11) UNIQUE 
CHECK (bvn ~ '^[0-9]{11}$');

-- 4. KYC verification flag
ALTER TABLE users
ADD COLUMN kyc_verified BOOLEAN DEFAULT FALSE

-- 5. Constraint to make it so that one of nin or bvn is enough
ALTER TABLE users 
ADD CONSTRAINT at_least_one_identity 
CHECK ((nin IS NOT NULL) OR (bvn IS NOT NULL)) 
NOT VALID;