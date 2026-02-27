-- ════════════════════════════════════════════════════════════
-- Migration 004 — Client Notifications
-- Notifie les clients en temps réel pour les événements qui
-- les concernent (réponse ticket, changement de statut projet,
-- changement de statut demande de modification).
-- ════════════════════════════════════════════════════════════

-- ── Helper: notify a specific user (client or admin) ─────────────────────
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id UUID,
  p_type    TEXT,
  p_title   TEXT,
  p_body    TEXT    DEFAULT NULL,
  p_link    TEXT    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (p_user_id, p_type, p_title, p_body, p_link);
END;
$$;

-- ── Trigger 1: réponse admin à un ticket → notif client ──────────────────
-- Déclenché sur ticket_messages quand un admin répond (non-interne).
CREATE OR REPLACE FUNCTION on_ticket_message_for_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket         support_tickets%ROWTYPE;
  v_sender_role    TEXT;
  v_preview        TEXT;
BEGIN
  -- Ignorer les notes internes (not visible to client)
  IF NEW.is_internal THEN
    RETURN NEW;
  END IF;

  -- Récupérer le ticket
  SELECT * INTO v_ticket FROM support_tickets WHERE id = NEW.ticket_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Récupérer le rôle du sender
  SELECT role INTO v_sender_role FROM profiles WHERE id = NEW.sender_id;

  -- Ne notifier le client que si c'est un admin qui répond
  IF v_sender_role != 'admin' THEN
    RETURN NEW;
  END IF;

  -- Aperçu du message (max 120 caractères)
  v_preview := LEFT(NEW.message, 120);
  IF LENGTH(NEW.message) > 120 THEN
    v_preview := v_preview || '…';
  END IF;

  PERFORM notify_user(
    v_ticket.client_id,
    'ticket_reply',
    'Réponse à votre ticket : ' || v_ticket.subject,
    v_preview,
    '/support/' || v_ticket.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ticket_message_client ON ticket_messages;
CREATE TRIGGER trigger_ticket_message_client
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION on_ticket_message_for_client();

-- ── Trigger 2: changement de statut projet → notif client ────────────────
CREATE OR REPLACE FUNCTION on_project_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_label TEXT;
BEGIN
  -- Seulement quand le statut change réellement
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_label := CASE NEW.status
    WHEN 'in_progress'  THEN 'En cours de développement'
    WHEN 'review'       THEN 'En review — votre validation est attendue'
    WHEN 'deployed'     THEN 'Déployé en production'
    WHEN 'maintenance'  THEN 'En maintenance'
    WHEN 'paused'       THEN 'Mis en pause'
    WHEN 'archived'     THEN 'Archivé'
    ELSE NEW.status
  END;

  PERFORM notify_user(
    NEW.client_id,
    'project_update',
    NEW.name || ' — ' || v_label,
    NULL,
    '/projects/' || NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_project_status_client ON projects;
CREATE TRIGGER trigger_project_status_client
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION on_project_status_changed();

-- ── Trigger 3: changement statut demande de modif → notif client ─────────
CREATE OR REPLACE FUNCTION on_update_request_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_label TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_label := CASE NEW.status
    WHEN 'accepted'    THEN 'Acceptée — en attente de planification'
    WHEN 'in_progress' THEN 'En cours de réalisation'
    WHEN 'completed'   THEN 'Terminée'
    WHEN 'rejected'    THEN 'Refusée — consultez les notes'
    ELSE NEW.status
  END;

  PERFORM notify_user(
    NEW.client_id,
    'project_update',
    'Modification "' || NEW.title || '" : ' || v_label,
    NEW.admin_notes,
    '/updates'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_request_client ON update_requests;
CREATE TRIGGER trigger_update_request_client
  AFTER UPDATE ON update_requests
  FOR EACH ROW
  EXECUTE FUNCTION on_update_request_status_changed();

-- ── Trigger 4: ticket admin résolu → notif client ────────────────────────
CREATE OR REPLACE FUNCTION on_ticket_resolved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Seulement passage vers 'resolved'
  IF NEW.status != 'resolved' OR OLD.status = 'resolved' THEN
    RETURN NEW;
  END IF;

  PERFORM notify_user(
    NEW.client_id,
    'ticket_reply',
    'Ticket résolu : ' || NEW.subject,
    'Votre ticket a été marqué comme résolu. Répondez si besoin de continuer.',
    '/support/' || NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ticket_resolved_client ON support_tickets;
CREATE TRIGGER trigger_ticket_resolved_client
  AFTER UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION on_ticket_resolved();
