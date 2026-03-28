-- =============================================================
-- YTW Portal — Full Database Setup
-- Run this once in the Supabase SQL Editor (Project > SQL Editor)
-- =============================================================


-- -------------------------------------------------------------
-- TENANTS & AUTH
-- -------------------------------------------------------------

CREATE TABLE public."Tenants" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'internal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT tenants_pkey PRIMARY KEY (id),
  CONSTRAINT unique_subdomain UNIQUE (subdomain)
);

CREATE TABLE public."UserTenants" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usertenants_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_tenant UNIQUE (user_id, tenant_id),
  CONSTRAINT UserTenants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id) ON DELETE CASCADE,
  CONSTRAINT UserTenants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);


-- -------------------------------------------------------------
-- DEPARTMENTS
-- -------------------------------------------------------------

CREATE TABLE public."Departments" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  parent_department_id uuid,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT departments_pkey PRIMARY KEY (id),
  CONSTRAINT unique_department_name_per_tenant UNIQUE (name, tenant_id),
  CONSTRAINT departments_parent_department_id_fkey FOREIGN KEY (parent_department_id) REFERENCES "Departments" (id) ON DELETE CASCADE,
  CONSTRAINT departments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Departments_tenant_id_idx" ON public."Departments" USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS "Departments_parent_department_id_idx" ON public."Departments" USING btree (parent_department_id);


-- -------------------------------------------------------------
-- POSITIONS
-- -------------------------------------------------------------

CREATE TABLE public."Positions" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  department_id uuid,
  level VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT positions_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id),
  CONSTRAINT department_fk FOREIGN KEY (department_id) REFERENCES "Departments" (id)
);


-- -------------------------------------------------------------
-- EMPLOYEES
-- -------------------------------------------------------------

CREATE TABLE public."Employees" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_email VARCHAR(200) NOT NULL,
  personal_email VARCHAR(200) NOT NULL,
  given_name VARCHAR(150) NOT NULL,
  surname VARCHAR(100),
  citizenship VARCHAR(2),
  tax_residence VARCHAR(2),
  location VARCHAR(2),
  mobile_number VARCHAR(50),
  home_address VARCHAR(250),
  birth_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  tenant_id uuid NOT NULL,
  CONSTRAINT employees_pkey PRIMARY KEY (id),
  CONSTRAINT Employees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Employees_tenant_id_idx" ON public."Employees" USING btree (tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_email ON public."Employees" USING btree (company_email);

CREATE TABLE public."EmployeeDepartments" (
  employee_id uuid NOT NULL,
  department_id uuid NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_departments_pkey PRIMARY KEY (employee_id, department_id),
  CONSTRAINT employee_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES "Departments" (id) ON DELETE CASCADE,
  CONSTRAINT employee_departments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "Employees" (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "EmployeeDepartments_department_id_idx" ON public."EmployeeDepartments" USING btree (department_id);
CREATE INDEX IF NOT EXISTS "EmployeeDepartments_employee_id_idx" ON public."EmployeeDepartments" USING btree (employee_id);


-- -------------------------------------------------------------
-- KNOWLEDGES (used by employee form; keep even without the UI page)
-- -------------------------------------------------------------

CREATE TABLE public."Knowledges" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT knowledges_pkey PRIMARY KEY (id),
  CONSTRAINT unique_knowledge_title_per_tenant UNIQUE (title, tenant_id),
  CONSTRAINT knowledges_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Knowledges_tenant_id_idx" ON public."Knowledges" USING btree (tenant_id);

CREATE TABLE public."EmployeeKnowledges" (
  employee_id uuid NOT NULL,
  knowledge_id uuid NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_knowledges_pkey PRIMARY KEY (employee_id, knowledge_id),
  CONSTRAINT employee_knowledges_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "Employees" (id) ON DELETE CASCADE,
  CONSTRAINT employee_knowledges_knowledge_id_fkey FOREIGN KEY (knowledge_id) REFERENCES "Knowledges" (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "EmployeeKnowledges_employee_id_idx" ON public."EmployeeKnowledges" USING btree (employee_id);
CREATE INDEX IF NOT EXISTS "EmployeeKnowledges_knowledge_id_idx" ON public."EmployeeKnowledges" USING btree (knowledge_id);


-- -------------------------------------------------------------
-- CONTRACTS & PAYROLL
-- -------------------------------------------------------------

CREATE TABLE public."ContractTypes" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  payment_type VARCHAR(20) NOT NULL, -- monthly, hourly, one_time
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contract_types_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

CREATE TABLE public."EmployeeContracts" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  contract_type_id uuid NOT NULL,
  position_id uuid NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  base_salary DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  working_hours INTEGER,
  overtime_rate DECIMAL(4,2),
  weekend_rate DECIMAL(4,2),
  holiday_rate DECIMAL(4,2),
  probation_period INTEGER,
  notice_period INTEGER,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_contracts_pkey PRIMARY KEY (id),
  CONSTRAINT employee_fk FOREIGN KEY (employee_id) REFERENCES "Employees" (id),
  CONSTRAINT contract_type_fk FOREIGN KEY (contract_type_id) REFERENCES "ContractTypes" (id),
  CONSTRAINT position_fk FOREIGN KEY (position_id) REFERENCES "Positions" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

CREATE TABLE public."WorkScheduleTypes" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  multiplier DECIMAL(4,2) NOT NULL,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT work_schedule_types_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

CREATE TABLE public."PublicHolidays" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name VARCHAR(100) NOT NULL,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT public_holidays_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

CREATE TABLE public."WorkLogs" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  schedule_type_id uuid NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  status VARCHAR(20) NOT NULL, -- pending, approved, rejected
  approved_by uuid,
  approved_at TIMESTAMPTZ,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT work_logs_pkey PRIMARY KEY (id),
  CONSTRAINT employee_fk FOREIGN KEY (employee_id) REFERENCES "Employees" (id),
  CONSTRAINT schedule_type_fk FOREIGN KEY (schedule_type_id) REFERENCES "WorkScheduleTypes" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

CREATE TABLE public."Payslips" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(12,2) NOT NULL,
  total_allowances DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_overtime DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_salary DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL, -- draft, approved, paid
  payment_date DATE,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payslips_pkey PRIMARY KEY (id),
  CONSTRAINT contract_fk FOREIGN KEY (contract_id) REFERENCES "EmployeeContracts" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);


-- -------------------------------------------------------------
-- SEED: YTW Tenant
-- This creates the single tenant record for the portal.
-- After running, copy the printed tenant_id for use in UserTenants.
-- -------------------------------------------------------------

INSERT INTO public."Tenants" (name, subdomain, plan)
VALUES ('YTW', 'ytw', 'internal')
RETURNING id, name, subdomain;
