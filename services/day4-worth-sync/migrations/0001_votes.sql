CREATE TABLE IF NOT EXISTS votes (
  session TEXT NOT NULL,
  voter TEXT NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('morning','money','care','space','life')),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (session, voter)
);
CREATE INDEX IF NOT EXISTS votes_expiry ON votes(updated_at);
