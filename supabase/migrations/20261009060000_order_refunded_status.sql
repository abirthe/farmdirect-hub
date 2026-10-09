-- Adds the REFUNDED terminal state. Separate migration: a new enum value cannot be used in the transaction that adds it.
-- Rollback: enum values cannot be dropped in Postgres; leaving the value unused is harmless.
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'REFUNDED';
