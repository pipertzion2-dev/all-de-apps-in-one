-- PKCE state for Google Search Console OAuth (Connect with Google)
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  code_verifier TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  redirect_after TEXT,
  callback_base TEXT
);
