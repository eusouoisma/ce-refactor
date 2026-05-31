-- 002_ai_chat_messages.sql
-- Stores AI chat sessions and messages per user

CREATE TABLE IF NOT EXISTS "aiChatMessages" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "users"("id"),
  "sessionId" TEXT NOT NULL DEFAULT '',
  "role" TEXT NOT NULL DEFAULT 'user',
  "content" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aichatmessages_userid ON "aiChatMessages" ("userId");
CREATE INDEX IF NOT EXISTS idx_aichatmessages_sessionid ON "aiChatMessages" ("sessionId");
CREATE INDEX IF NOT EXISTS idx_aichatmessages_createdat ON "aiChatMessages" ("createdAt");
