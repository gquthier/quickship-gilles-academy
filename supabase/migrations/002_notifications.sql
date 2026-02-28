-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users see only their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can insert notifications for anyone
CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role bypass (for server-side inserts)
CREATE POLICY "Service role can manage notifications"
  ON notifications FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================
-- TRIGGER: notify admins on new support ticket
-- ============================================

CREATE OR REPLACE FUNCTION notify_admins_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  ticket_subject TEXT;
BEGIN
  ticket_subject := NEW.subject;

  FOR admin_id IN
    SELECT id FROM profiles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (
      admin_id,
      'new_ticket',
      'Nouveau ticket support',
      ticket_subject,
      '/admin/support/' || NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_support_ticket
  AFTER INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION notify_admins_new_ticket();

-- ============================================
-- TRIGGER: notify client on new ticket message (non-internal)
-- ============================================

CREATE OR REPLACE FUNCTION notify_ticket_reply()
RETURNS TRIGGER AS $$
DECLARE
  ticket_rec RECORD;
BEGIN
  -- Skip internal notes
  IF NEW.is_internal THEN
    RETURN NEW;
  END IF;

  SELECT client_id, subject INTO ticket_rec
  FROM support_tickets WHERE id = NEW.ticket_id;

  -- Notify client if sender is not the client
  IF NEW.sender_id != ticket_rec.client_id THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (
      ticket_rec.client_id,
      'ticket_reply',
      'Réponse à votre ticket',
      ticket_rec.subject,
      '/support/' || NEW.ticket_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ticket_message
  AFTER INSERT ON ticket_messages
  FOR EACH ROW EXECUTE FUNCTION notify_ticket_reply();
