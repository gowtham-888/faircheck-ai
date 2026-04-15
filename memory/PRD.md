# FairCheck AI - PRD

## Problem Statement
Build a modern AI-powered web application called "FairCheck AI – Bias Detection & Fairness Analysis Platform" for a hackathon prototype.

## Architecture
- **Frontend**: React + Tailwind CSS + Framer Motion + Recharts + Shadcn UI
- **Backend**: FastAPI + Pandas + ReportLab (PDF generation)
- **Database**: MongoDB (Motor async driver)

## Core Requirements
- CSV upload with drag & drop
- Sample dataset for demo
- Bias analysis (statistical parity + disparate impact ratio)
- Fairness score (0-100)
- Interactive charts (Gender vs Hired, Income vs Selection)
- Bias alerts and AI-generated insights
- Export reports (PDF/CSV)
- Creators/Innovators section

## What's Been Implemented
- [2026-04-15] MVP: Full homepage, analysis page, bias detection engine, charts, fairness scoring
- [2026-04-15] Feature: Export PDF/CSV reports at bottom of analysis page
- [2026-04-15] Feature: "Meet the Innovators" section with Gowtham K & Srushti B.S profiles
- [2026-04-15] Polish: Smoother animations, custom scrollbar, enhanced hover effects

## User Personas
- Hackathon judges evaluating the prototype
- HR teams analyzing hiring fairness
- Data scientists reviewing bias in datasets

## Prioritized Backlog
- P0: All completed
- P1: Historical analysis tracking, more bias metrics (age, education)
- P2: User accounts/authentication, team collaboration features

## Next Tasks
- Add more bias dimensions (age, race, education level analysis)
- Implement historical tracking of analyses over time
- Add comparison mode for before/after bias mitigation
