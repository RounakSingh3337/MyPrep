"""
AI Interview Question Generator — Gemini Edition
Run: python app.py
Then open: http://localhost:5000
"""

import os
import json
import re
import requests
from flask import Flask, render_template, request, jsonify
from bs4 import BeautifulSoup
import PyPDF2
import io
import google.generativeai as genai

app = Flask(__name__)

# ── Gemini client ────────────────────────────────────────────────────────────
genai.configure(api_key=os.environ.get("AAIzaSyClRoXAFEAS3G5lmRDikMwzs06VYKf4Zs8", ""))
model = genai.GenerativeModel("gemini-2.5-flash")


# ── Helpers ─────────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from an uploaded PDF resume."""
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def scrape_jd_from_url(url: str) -> str:
    """Fetch and strip a job-description webpage down to plain text."""
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        return text[:4000]
    except Exception as e:
        return f"[Could not fetch JD: {e}]"


def generate_questions(resume_text: str, jd_text: str, num_questions: int = 20) -> list[dict]:
    """Call Gemini to produce structured interview questions."""

    prompt = f"""You are an expert technical interviewer and career coach.
Given a candidate's resume and a job description, generate targeted, insightful interview questions.

Respond ONLY with a valid JSON array (no markdown, no explanation, no backticks).
Each element must be an object with exactly these keys:
  - "question": string (the interview question)
  - "category": one of ["Technical Skills", "Behavioral", "System Design", "Problem Solving", "Cultural Fit", "Leadership"]
  - "difficulty": one of ["Easy", "Medium", "Hard"]
  - "hint": string (what the interviewer is looking for, 1-2 sentences)
  - "tags": array of short string tags (e.g. ["Python", "OOP"])

RESUME:
{resume_text[:3000]}

JOB DESCRIPTION:
{jd_text[:3000]}

Generate exactly {num_questions} interview questions tailored to this candidate and role.
Cover a mix of categories and difficulties. Be specific — reference real skills, projects,
and responsibilities from the resume and JD.

Return ONLY the JSON array. No explanation, no markdown fences."""

    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Strip possible markdown fences
    raw = re.sub(r"^```(?:json)?", "", raw).strip()
    raw = re.sub(r"```$", "", raw).strip()

    return json.loads(raw)


# ── Routes ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/generate", methods=["POST"])
def api_generate():
    """Main endpoint: accepts resume (PDF or text) + JD (URL or text)."""
    try:
        resume_text = ""
        jd_text = ""

        # ── Resume ──────────────────────────────────────────────────────────
        if "resume_file" in request.files and request.files["resume_file"].filename:
            file = request.files["resume_file"]
            resume_text = extract_text_from_pdf(file.read())
        else:
            resume_text = request.form.get("resume_text", "").strip()

        if not resume_text:
            return jsonify({"error": "Please provide a resume (PDF upload or paste text)."}), 400

        # ── Job Description ─────────────────────────────────────────────────
        jd_url = request.form.get("jd_url", "").strip()
        if jd_url:
            jd_text = scrape_jd_from_url(jd_url)
        else:
            jd_text = request.form.get("jd_text", "").strip()

        if not jd_text:
            return jsonify({"error": "Please provide a job description (URL or paste text)."}), 400

        # ── Number of questions ─────────────────────────────────────────────
        try:
            num_questions = int(request.form.get("num_questions", 20))
            num_questions = max(5, min(40, num_questions))
        except ValueError:
            num_questions = 20

        questions = generate_questions(resume_text, jd_text, num_questions)
        return jsonify({"questions": questions, "count": len(questions)})

    except json.JSONDecodeError as e:
        return jsonify({"error": f"Failed to parse AI response: {e}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/followup", methods=["POST"])
def api_followup():
    """Generate 3 follow-up questions for a selected question."""
    try:
        data = request.get_json()
        question = data.get("question", "")
        context  = data.get("context", "")

        prompt = f"""Given this interview question: "{question}"
And context: {context}

Generate 3 sharp follow-up questions that dig deeper.
Respond ONLY as a JSON array of strings. No markdown, no explanation."""

        response = model.generate_content(prompt)
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?", "", raw).strip()
        raw = re.sub(r"```$", "", raw).strip()

        follow_ups = json.loads(raw)
        return jsonify({"follow_ups": follow_ups})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)