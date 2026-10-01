export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ""
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        cell += character
      }
      continue
    }

    if (character === '"') {
      inQuotes = true
    } else if (character === ",") {
      row.push(cell)
      cell = ""
    } else if (character === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else if (character !== "\r") {
      cell += character
    }
  }

  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }

  const filled = rows.filter((columns) => columns.some((value) => value !== ""))
  if (!filled.length) return []

  const headers = filled[0].map((header) => header.trim())
  return filled.slice(1).map((columns) =>
    Object.fromEntries(headers.map((header, index) => [header, (columns[index] ?? "").trim()])),
  )
}

export function csvEscape(value) {
  const text = String(value ?? "")
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}
