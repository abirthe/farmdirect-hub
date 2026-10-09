-- Migration: Payment Flow Hardening with Manual bKash Escrow Deposit & Verification
-- Step 1: Enum enhancement for payment states
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'PAYMENT_SUBMITTED';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'CANCELLED';
