-- L LIVE: საერთო მონაცემთა მოდელი
CREATE TABLE sports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE competitions (
  id TEXT PRIMARY KEY,
  sport_id TEXT NOT NULL REFERENCES sports(id),
  name TEXT NOT NULL,
  source_url TEXT,
  source_name TEXT
);
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport_id TEXT NOT NULL REFERENCES sports(id)
);
CREATE TABLE athletes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport_id TEXT NOT NULL REFERENCES sports(id)
);
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  sport_id TEXT NOT NULL REFERENCES sports(id),
  competition_id TEXT NOT NULL REFERENCES competitions(id),
  starts_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  home_name TEXT,
  away_name TEXT,
  home_score INT,
  away_score INT,
  minute TEXT,
  payload JSONB DEFAULT '{}',
  source_url TEXT,
  source_updated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE event_updates (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  update_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX events_status_idx ON events(status);
CREATE INDEX events_competition_idx ON events(competition_id);
