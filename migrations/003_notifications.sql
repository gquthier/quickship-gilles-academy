-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'new_client' | 'new_ticket' | 'ticket_reply' | 'project_update' | 'payment' | 'deadline'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT, -- optional deeplink URL
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Function to notify all admins
CREATE OR REPLACE FUNCTION notify_admins(
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link)
  SELECT id, p_type, p_title, p_body, p_link
  FROM profiles
  WHERE role = 'admin';
END;
$$;

-- Trigger: notify admins when a new support ticket is created
CREATE OR REPLACE FUNCTION on_new_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_name TEXT;
  project_name TEXT;
BEGIN
  SELECT full_name INTO client_name FROM profiles WHERE id = NEW.client_id;
  SELECT name INTO project_name FROM projects WHERE id = NEW.project_id;

  PERFORM notify_admins(
    'new_ticket',
    'Nouveau ticket : ' || NEW.subject,
    'De ' || COALESCE(client_name, 'Inconnu') || ' — ' || COALESCE(project_name, 'Sans projet'),
    '/admin/support/' || NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_new_ticket
  AFTER INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION on_new_ticket();

-- Trigger: notify admins when a new client registers
CREATE OR REPLACE FUNCTION on_new_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role = 'client' THEN
    PERFORM notify_admins(
      'new_client',
      'Nouveau client : ' || NEW.full_name,
      COALESCE(NEW.company, NEW.email),
      '/admin/clients/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_new_client
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION on_new_client();
