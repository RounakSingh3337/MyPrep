# InterviewAI — AI-Powered Interview Question Generator

Generate personalised, role-specific interview questions from your resume and any job link.

---

## Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Set your Anthropic API key
```bash
# Mac / Linux
export ANTHROPIC_API_KEY="sk-ant-..."

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="sk-ant-..."
```
Get your key at → https://console.anthropic.com

### 3. Run the app
```bash
python app.py
```

### 4. Open in browser
```
http://localhost:5000
```

---

## Features

- **PDF resume upload** — drag & drop or browse
- **Job URL scraping** — paste any LinkedIn / Indeed / Greenhouse / Lever link
- **20–40 tailored questions** — you pick the count
- **6 categories** — Technical, Behavioral, System Design, Problem Solving, Cultural Fit, Leadership
- **3 difficulty levels** — Easy / Medium / Hard
- **Hints** — what the interviewer is actually looking for
- **Follow-up questions** — one click to drill deeper
- **Copy all** — paste into Notion, Google Docs, etc.
- **Filter by category**

---

## Project Structure

```
interview_platform/
├── app.py              ← Flask backend + Claude API calls
├── requirements.txt
├── templates/
│   └── index.html      ← Single-page UI
└── static/
    ├── style.css
    └── app.js
```
