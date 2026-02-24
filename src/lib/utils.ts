import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Project
    draft: 'badge-info',
    in_progress: 'badge-warning',
    review: 'badge-purple',
    deployed: 'badge-success',
    maintenance: 'badge-info',
    paused: 'badge-warning',
    archived: 'badge-error',
    // Ticket
    open: 'badge-error',
    waiting_client: 'badge-warning',
    waiting_team: 'badge-info',
    resolved: 'badge-success',
    closed: 'badge-success',
    // Subscription
    active: 'badge-success',
    past_due: 'badge-error',
    canceled: 'badge-error',
    trialing: 'badge-info',
    // Update request
    pending: 'badge-warning',
    accepted: 'badge-info',
    completed: 'badge-success',
    rejected: 'badge-error',
  }
  return colors[status] || 'badge-info'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    in_progress: 'En cours',
    review: 'En revue',
    deployed: 'Déployé',
    maintenance: 'Maintenance',
    paused: 'En pause',
    archived: 'Archivé',
    open: 'Ouvert',
    waiting_client: 'Attente client',
    waiting_team: 'Attente équipe',
    resolved: 'Résolu',
    closed: 'Fermé',
    active: 'Actif',
    past_due: 'En retard',
    canceled: 'Annulé',
    trialing: 'Essai',
    pending: 'En attente',
    accepted: 'Accepté',
    completed: 'Terminé',
    rejected: 'Refusé',
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente',
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise',
    mvp: 'MVP',
    website: 'Site Web',
    redesign: 'Refonte',
  }
  return labels[status] || status
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'text-text-muted',
    medium: 'text-amber-400',
    high: 'text-orange-400',
    urgent: 'text-red-400',
  }
  return colors[priority] || 'text-text-muted'
}
