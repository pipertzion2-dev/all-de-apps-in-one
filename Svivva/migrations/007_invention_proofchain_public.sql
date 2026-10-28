-- ProofChain public certificate convention:
-- Rows in invention_verification_records may use
--   method = 'public_cert:<publicCertId>'
--   detail = JSON with only authorized public fields (never private descriptions)
-- Consumed by /api/poor-man-protection/invention-studio/public-cert/[publicCertId]

SELECT 1;
