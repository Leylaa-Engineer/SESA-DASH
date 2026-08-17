CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'sorumlu' CHECK (role IN ('sorumlu', 'admin')),
  department_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  department_name TEXT,
  created_by_email TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  machine_code TEXT,
  machine_name TEXT,
  department_id TEXT,
  department_name TEXT,
  reporter_email TEXT,
  description TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'Açık' CHECK (status IN ('Açık', 'İşlemde', 'Çözüldü')),
  resolved_at TIMESTAMPTZ,
  resolved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  responsible_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_status_history (
  id BIGSERIAL PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_machines_code ON machines(code);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
