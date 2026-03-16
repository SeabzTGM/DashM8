# Product Requirements Document

ServiceM8 + Xero Business Dashboard

------------------------------------------------------------------------

# Product Vision

Provide service business owners with a **real‑time operational and
financial dashboard** combining ServiceM8 job data with Xero accounting
data.

The dashboard should allow quick visibility of:

-   Operational workload
-   Staff productivity
-   Revenue performance
-   Cash flow
-   Outstanding payments
-   Business risks

------------------------------------------------------------------------

# Target Users

Primary - Service business owners - Operations managers

Secondary - Financial managers - Dispatch managers

------------------------------------------------------------------------

# Core Features

## Operational Metrics

Jobs Completed - Today - This week - This month

Jobs by staff member

Average job completion time

Job status pipeline

------------------------------------------------------------------------

## Financial Metrics

Revenue invoiced Cash received Average job value Revenue per technician

Material costs Material cost percentage

Gross margin per job

------------------------------------------------------------------------

## Cash Flow

Invoices awaiting payment Overdue invoices Debtors aging buckets

0--30 days 31--60 days 61--90 days 90+ days

Average days to payment

------------------------------------------------------------------------

## Exception Monitoring

Jobs needing attention

Completed but not invoiced Invoiced but unpaid Jobs stuck in workflow
Jobs with unusually high material costs

------------------------------------------------------------------------

# Integrations

## ServiceM8

Used for:

Jobs Staff Job materials Job statuses Scheduling Operational metrics

Key endpoints

/jobs /jobmaterials /staff

------------------------------------------------------------------------

## Xero

Used for:

Invoices Payments Contacts Financial reporting

Key endpoints

/Invoices /Payments /Contacts /Reports

------------------------------------------------------------------------

# Data Model

Core entities

Staff Jobs JobMaterials Customers Invoices Payments

Mappings

servicem8_job_uuid servicem8_staff_uuid xero_invoice_id xero_contact_id

------------------------------------------------------------------------

# KPI Calculations

Revenue Sum of Xero invoice totals

Cash Collected Sum of Xero payments

Material Cost Sum of ServiceM8 job material totals

Jobs Completed Count of jobs with status = Completed

Jobs Awaiting Payment Completed jobs with unpaid invoice

------------------------------------------------------------------------

# Sync Strategy

Pull data every 10 minutes.

Sync modules

ServiceM8 sync - jobs - staff - materials

Xero sync - invoices - payments - contacts

Store normalized data locally.

Calculate metrics from local data.

------------------------------------------------------------------------

# MVP Scope

Overview dashboard

Metrics - Jobs completed - Revenue invoiced - Cash collected - Material
cost - Jobs awaiting payment - Overdue invoices

Charts - Revenue trend - Jobs completed trend

Tables - Staff leaderboard - Jobs needing attention

------------------------------------------------------------------------

# Future Features

Forecasting Profit per technician Quote conversion rate Customer
lifetime value Geographic job heatmaps

AI insights - anomaly detection - job margin alerts - forecast revenue
