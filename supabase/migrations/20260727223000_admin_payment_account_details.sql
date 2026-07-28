alter table public.admin_payment_accounts
  add column if not exists holder_name text,
  add column if not exists document_type text,
  add column if not exists document_number text,
  add column if not exists pix_key_type text,
  add column if not exists pix_key text,
  add column if not exists bank_name text,
  add column if not exists branch_number text,
  add column if not exists account_number text,
  add column if not exists account_type text;

alter table public.admin_payment_accounts
  add constraint admin_payment_accounts_document_type_valid
  check (document_type is null or document_type in ('cpf', 'cnpj', 'passaporte', 'outro'));

alter table public.admin_payment_accounts
  add constraint admin_payment_accounts_account_type_valid
  check (account_type is null or account_type in ('corrente', 'poupanca', 'pagamento', 'outro'));
