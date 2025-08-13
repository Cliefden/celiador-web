/**
 * Enum representing the different roles a user can have in the application
 */
export enum UserRole {
  SUPER = 'super',
  ADMIN = 'admin',
  CLIENT = 'client',
  SUPPLIER = 'supplier',
  USER = 'user',
}

/**
 * Type for individual data
 */
export interface Individual {
  id: string;
  first_name?: string;
  middle_name?: string;
  pre_last_name?: string;
  last_name?: string;
  name_prefix?: string;
  name_suffix?: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Type for user profile data including role
 */
export interface UserProfile {
  id: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  middle_name?: string;
  pre_last_name?: string;
  last_name?: string;
  personal_id?: string;
  name_prefix?: string;
  name_suffix?: string;
  email?: string;
}

/**
 * Unified Invoice type for use throughout the app
 */
export interface Invoice {
  id: string;
  supplier: string;
  client: string;
  amount: number;
  currency: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  approved_at?: string;
  paid_out_at?: string;
  repaid_at?: string;
  payment_sum?: number;
  repayment_sum?: number;
  invoice_type?: {
    id?: string;
    cash_discount: number; // always number
    maturity?: number;
    for_payer?: number;
    [key: string]: unknown;
  };
  cash_discount: number; // always number
  for_payer?: number;
  rejection_reason?: string;
  rejected_at?: string;
  created_at?: string;
  maturity?: number;
  payments?: Payment[];
  repayments?: Payment[];
  disbursers?: string[];
  payer_orgs?: string[];
  payer?: string;
  pdf_path?: string;
  [key: string]: unknown;
}

export interface Org {
  id: string;
  name: string;
  // Add other fields as needed
}

export interface Payment {
  invoice?: string;
  amount: number;
  created_at: string;
  creator: string;
} 