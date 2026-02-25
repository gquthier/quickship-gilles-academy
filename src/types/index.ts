export type UserRole = 'admin' | 'client'

export type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'deployed' | 'maintenance' | 'paused' | 'archived'

export type TicketStatus = 'open' | 'in_progress' | 'waiting_client' | 'waiting_team' | 'resolved' | 'closed'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise'

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'

export type QuestionnaireType = 'mvp' | 'website' | 'redesign'

export type UpdateRequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected'

export interface Profile {
  id: string
  email: string
  full_name: string
  company: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  client_id: string
  name: string
  description: string | null
  domain: string | null
  vercel_project_id: string | null
  vercel_team_id: string | null
  github_repo: string | null
  github_org: string | null
  tech_stack: string[]
  status: ProjectStatus
  delivery_status: string | null
  deployed_url: string | null
  staging_url: string | null
  notes: string | null
  ai_prompt: string | null
  created_at: string
  updated_at: string
  client?: Profile
}

export interface Subscription {
  id: string
  client_id: string
  project_id: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  price_monthly: number | null
  start_date: string
  end_date: string | null
  features: Record<string, unknown>
  created_at: string
  updated_at: string
  project?: Project
}

export interface SupportTicket {
  id: string
  project_id: string
  client_id: string
  assigned_to: string | null
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  project?: Project
  client?: Profile
  assignee?: Profile
}

export interface TicketMessage {
  id: string
  ticket_id: string
  sender_id: string
  message: string
  attachments: unknown[]
  is_internal: boolean
  created_at: string
  sender?: Profile
}

export interface UpdateRequest {
  id: string
  project_id: string
  client_id: string
  title: string
  description: string
  status: UpdateRequestStatus
  priority: TicketPriority
  estimated_hours: number | null
  attachments: unknown[]
  admin_notes: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  project?: Project
}

export interface OnboardingResponse {
  id: string
  project_id: string | null
  client_id: string | null
  questionnaire_type: QuestionnaireType
  responses: Record<string, unknown>
  submitted_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  notes: string | null
  created_at: string
  client?: Profile
  project?: Project
}

export interface ActivityLog {
  id: string
  user_id: string | null
  project_id: string | null
  action: string
  details: Record<string, unknown>
  created_at: string
}

// Stripe types
export interface StripeRevenue {
  thisMonth: number
  lastMonth: number
  thisWeek: number
  mrr: number
  trend: number | null
}

export interface StripePayment {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  customerName: string
  customerEmail: string | null
}

export interface StripeCustomerSpending {
  name: string
  email: string | null
  totalSpent: number
  chargeCount: number
  matchedProfileName: string | null
}

export interface StripeData {
  revenue: StripeRevenue
  recentPayments: StripePayment[]
  customerSpending: StripeCustomerSpending[]
  activeSubscriptions: number
}

// Vercel types
export interface VercelDeployment {
  uid: string
  name: string
  url: string
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED'
  created: number
  buildingAt?: number
  ready?: number
  source?: string
  meta?: {
    githubCommitSha?: string
    githubCommitMessage?: string
    githubCommitRef?: string
  }
}
