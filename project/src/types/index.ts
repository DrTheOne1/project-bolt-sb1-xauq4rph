import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User extends SupabaseUser {
  isAdmin?: boolean;
}

export interface Message {
  id: string;
  user_id: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CountryStats {
  country: string;
  count: number;
}

export interface AdminStats {
  totalMessages: number;
  successRate: number;
  topCountries: CountryStats[];
  failedMessages: number;
}

export type TranslationKey =
  | 'common.loading'
  | 'common.error'
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.add'
  | 'common.search'
  | 'common.noResults'
  | 'common.confirm'
  | 'common.yes'
  | 'common.no'
  | 'common.success'
  | 'common.warning'
  | 'common.info'
  | 'common.actions.retry'
  | 'common.actions.close'
  | 'common.actions.submit'
  | 'navigation.dashboard'
  | 'navigation.messaging'
  | 'navigation.contacts'
  | 'navigation.templates'
  | 'navigation.analytics'
  | 'navigation.settings'
  | 'auth.signIn'
  | 'auth.signOut'
  | 'auth.register'
  | 'auth.email'
  | 'auth.password'
  | 'auth.confirmPassword'
  | 'auth.error.validation.confirmPassword'
  | 'billing.title'
  | 'billing.description'
  | 'billing.currentUsage'
  | 'billing.monitorUsage'
  | 'billing.currentPlan'
  | 'billing.creditsLeft'
  | 'billing.nextBilling'
  | 'billing.availablePlans'
  | 'billing.billingHistory'
  | 'billing.noActivePlan'
  | 'billing.insufficientCredits'
  | 'billing.plans.free'
  | 'billing.plans.basic'
  | 'billing.plans.pro'
  | 'billing.plans.enterprise'
  | 'billing.selectPlan'; 