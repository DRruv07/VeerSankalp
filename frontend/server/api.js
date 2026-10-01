import fs from "node:fs"
import path from "node:path"
import { csvEscape } from "../src/lib/csv.js"

const ORIGINAL_DIR = "C:\\Users\\dhruv kheraniya\\Desktop\\Data-set\\data"
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]

function send(res, status, body) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8")
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(new Error("The request body was not valid JSON."))
      }
    })
    req.on("error", reject)
  })
}

function promptFor(body) {
  const role = body.role || "OFFICER"
  const audience = {
    OFFICER: "Write to the officer in calm, practical language about their own record. No clinical diagnosis.",
    WELFARE: "Write to the welfare officer about follow-up, priority, and the next check.",
    COMMANDER: "Write to the commander about duty load, welfare visits, and whether lighter duty is appropriate.",
    ADMIN: "Write a short dataset brief for the administrator. Do not invent officers.",
  }[role]

  return `You are the welfare analyst inside VeerSankalp, a mental-health tracking app for Indian uniformed officers.
This is decision support for welfare follow-up. It is not a medical diagnosis.
${audience}
Use the supplied band and score exactly. Do not change them.
Return only JSON with keys headline (max 12 words), summary (max 70 words), actions (array of 3 short strings).

Role: ${role}
Band: ${body.assessment?.band || ""}
Score: ${body.assessment?.score ?? ""}
Reasons: ${(body.assessment?.reasons || []).join("; ")}
Roster: ${body.roster ? JSON.stringify(body.roster) : "none"}
Officer: ${JSON.stringify(body.officer || {})}`
}

function parseModelJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim()
  return JSON.parse(cleaned)
}

async function callGemini(apiKey, body) {
  const payload = {
    contents: [{ role: "user", parts: [{ text: promptFor(body) }] }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  }
  let lastError = "Gemini did not return a view."

  for (const model of MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    )
    if (!response.ok) {
      lastError = (await response.text()).slice(0, 280)
      continue
    }
    const json = await response.json()
    const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || ""
    const parsed = parseModelJson(text)
    return {
      ok: true,
      headline: parsed.headline,
      summary: parsed.summary,
      actions: parsed.actions,
      model,
    }
  }

  throw new Error(lastError)
}

function appendRow(filePath, values) {
  const existing = fs.readFileSync(filePath, "utf8")
  const headerLine = existing.split(/\r?\n/).find((line) => line.trim()) || ""
  const headers = headerLine.split(",").map((header) => header.trim())
  const line = headers.map((header) => csvEscape(values[header] ?? "")).join(",")
  const prefix = existing.endsWith("\n") || existing.length === 0 ? "" : "\n"
  fs.appendFileSync(filePath, `${prefix}${line}\n`, "utf8")
}

function writeOfficerFiles(directory, officer) {
  appendRow(path.join(directory, "indian_uniform_forces.csv"), officer)
  appendRow(path.join(directory, "workload.csv"), {
    service_no: officer.service_no,
    weekly_duty_hours: officer.weekly_duty_hours,
    night_shifts_last_30_days: officer.night_shifts_last_30_days,
    overtime_hours_last_30_days: officer.overtime_hours_last_30_days,
    open_assignments: officer.open_assignments,
    updated_on: officer.updated_on,
  })
  appendRow(path.join(directory, "wellness_surveys.csv"), {
    service_no: officer.service_no,
    survey_date: officer.survey_date,
    stress_score: officer.stress_score,
    sleep_hours: officer.sleep_hours,
    mood_score: officer.mood_score,
    energy_score: officer.energy_score,
    felt_supported: officer.felt_supported,
  })
  appendRow(path.join(directory, "simulated_behavioral.csv"), {
    service_no: officer.service_no,
    record_date: officer.record_date,
    alertness_score: officer.alertness_score,
    fatigue_score: officer.fatigue_score,
    teamwork_score: officer.teamwork_score,
    punctuality_score: officer.punctuality_score,
    data_source: "Registered",
  })
}

function appendOfficer(officer) {
  if (!officer?.service_no || !officer?.full_name) {
    throw new Error("A service number and name are required.")
  }
  const appDir = path.resolve("public/data")
  writeOfficerFiles(appDir, officer)
  let wroteOriginal = false
  let originalMessage = ""
  try {
    writeOfficerFiles(ORIGINAL_DIR, officer)
    wroteOriginal = true
  } catch (error) {
    originalMessage = error.message
  }
  return {
    ok: true,
    wroteApp: true,
    wroteOriginal,
    message: wroteOriginal
      ? "Saved in the app database and the original dataset."
      : `Saved in the app database. The original dataset was not updated: ${originalMessage}`,
  }
}

export function veerApi(env) {
  return {
    name: "veer-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0]
        if (url !== "/api/ai/risk" && url !== "/api/dataset/officer") return next()
        if (req.method !== "POST") {
          send(res, 405, { ok: false, message: "Method not allowed" })
          return
        }

        try {
          const body = await readBody(req)
          if (url === "/api/ai/risk") {
            const apiKey = env.GEMINI_API_KEY?.trim()
            if (!apiKey) {
              send(res, 200, {
                ok: false,
                fallback: true,
                message: "Add GEMINI_API_KEY to frontend/.env and restart the app.",
              })
              return
            }
            send(res, 200, await callGemini(apiKey, body))
            return
          }
          send(res, 200, appendOfficer(body))
        } catch (error) {
          send(res, 500, { ok: false, message: error.message || "Request failed" })
        }
      })
    },
  }
}
