# Q3 Cyber Risk Assessment Report

## Executive Summary
This document outlines the primary cyber risks identified during the Q3 audit.

## Extracted Policies
- **Access Control Policy (ACP-01)**: All administrative accounts must enforce MFA. Currently missing on `legacy-crm`.
- **Data Encryption (DEP-02)**: At-rest encryption is required for all databases. Verified on `prod-db-cluster-01`.

## Incident Risks
- Ransomware susceptibility is considered **High** due to unpatched endpoints in the branch offices.
- Supply chain risk is **Medium** following the Acme Cloud Services audit.

## Financial Impact Estimates
- A breach in the `auth-service-api` could result in an estimated downstream loss of ₹50M due to SLA penalties and downtime.
- Compliance violation for DEP-02 could trigger fines up to ₹15M.
