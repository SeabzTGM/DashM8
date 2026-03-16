# ServiceM8 + Xero Business Dashboard

Desktop dashboard for service businesses using **ServiceM8** and
**Xero** APIs.

This project provides operational and financial insights including: -
Jobs completed - Revenue and margin - Material costs - Jobs awaiting
payment - Staff performance - Operational exceptions

The application is designed as a **Tauri + React + TypeScript desktop
app** with a small local backend layer and a lightweight database.

------------------------------------------------------------------------

# Project Goals

The goal of this dashboard is to give business owners and managers a
**single operational + financial view** of the company.

ServiceM8 provides operational job data while Xero provides accounting
and financial data.

Combining both creates a much clearer picture of business health.

------------------------------------------------------------------------

# Tech Stack

Frontend - React - TypeScript - Tailwind UI (optional) - Recharts or
Chart.js for charts

Desktop Shell - Tauri

Backend Layer - Node.js / TypeScript

Database - SQLite (via Prisma)

Integrations - ServiceM8 REST API - Xero Accounting API

------------------------------------------------------------------------

# Folder Structure

apps/ desktop/ Tauri desktop app packages/ core/ KPI calculations and
shared logic integrations/ servicem8/ ServiceM8 API client xero/ Xero
API client db/ Prisma schema and database access sync/ Data sync workers

------------------------------------------------------------------------

# Key Dashboard Screens

Overview - Revenue this month - Cash received this month - Jobs
completed - Jobs awaiting payment - Overdue invoices - Jobs needing
attention

Operations - Jobs by status - Jobs per staff member - Job completion
time - Operational backlog

Financial - Invoiced revenue - Cash collected - Debtors aging - Material
costs - Margin trends

Staff Performance - Jobs completed per technician - Revenue per
technician - Average job value - Utilisation

Exceptions - Completed jobs not invoiced - Invoices unpaid - Jobs stuck
in workflow - Low margin jobs

------------------------------------------------------------------------

# Development Setup

Install dependencies

npm install

Run desktop app

npm run tauri dev

------------------------------------------------------------------------

# Environment Variables

Create a .env file

SERVICEM8_API_KEY= SERVICEM8_COMPANY_UUID=

XERO_CLIENT_ID= XERO_CLIENT_SECRET= XERO_TENANT_ID=

------------------------------------------------------------------------

# First Development Tasks

1.  Scaffold Tauri + React app
2.  Create Prisma database schema
3.  Implement ServiceM8 client
4.  Implement Xero OAuth client
5.  Build sync service
6.  Build KPI calculation engine
7.  Build Overview dashboard

------------------------------------------------------------------------

# MVP Metrics

Jobs - Jobs completed today/week/month - Jobs completed per staff member

Revenue - Revenue invoiced - Cash received

Costs - Material cost per job - Material cost percentage

Payments - Jobs awaiting payment - Overdue invoices

Exceptions - Completed not invoiced - Invoiced but unpaid
