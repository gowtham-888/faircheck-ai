# FairCheck AI - PRD

## Problem Statement
Build a modern AI-powered web application called "FairCheck AI – Bias Detection & Fairness Analysis Platform" for a hackathon prototype.

## Architecture
- **Frontend**: React + Tailwind CSS + Framer Motion + Recharts + Shadcn UI
- **Backend**: FastAPI + Pandas + ReportLab (PDF generation)
- **Database**: MongoDB (Motor async driver)

## Core Requirements
- CSV upload with drag & drop
- Sample dataset for demo (24 records)
- Multi-dimensional bias analysis (Gender, Income, Age, Education)
- Fairness score (0-100) averaging all dimensions
- Interactive charts for all 4 bias dimensions
- Bias alerts and AI-generated insights
- Export reports (PDF/CSV) with all dimensions
- Historical analysis tracking with compare mode
- Live Demo Walkthrough for presentations
- Creators/Innovators section

## What's Been Implemented
- [2026-04-15] MVP: Full homepage, analysis page, bias detection engine, charts, fairness scoring
- [2026-04-15] Feature: Export PDF/CSV reports at bottom of analysis page
- [2026-04-15] Feature: "Meet the Innovators" section (Gowtham K & Srushti B.S)
- [2026-04-15] Feature: Age & Education bias dimensions with charts and alerts
- [2026-04-15] Feature: Historical analysis tracking (/history page)
- [2026-04-15] Feature: Compare Mode - side-by-side report comparison (/compare page)
- [2026-04-15] Feature: Live Demo Walkthrough auto-scroll button for presentations
- [2026-04-15] Polish: Smoother animations, custom scrollbar, professional styling

## Pages
1. Homepage (/) - Hero, Features, Innovators, About AI Bias, Footer
2. Analysis (/analysis) - Upload CSV, Dashboard, Insights, Export
3. History (/history) - Past analyses with compare mode
4. Compare (/compare) - Side-by-side report comparison

## Next Tasks
- Add downloadable sample CSV file
- Implement real-time collaboration features
- Add custom column mapping for diverse CSV formats
