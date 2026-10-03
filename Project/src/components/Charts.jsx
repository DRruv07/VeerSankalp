import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js"
import { Bar, Line } from "react-chartjs-2"
import { num } from "../lib/format.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = '"Source Sans 3", sans-serif'
ChartJS.defaults.color = "#57534e"

const scales = {
  y: { min: 0, max: 100, grid: { color: "#eee8dc" }, ticks: { stepSize: 25 } },
  x: { grid: { display: false } },
}

export function FactorChart({ officer }) {
  return (
    <Bar
      data={{
        labels: ["Stress", "Low mood", "Low energy", "Fatigue", "Short sleep"],
        datasets: [
          {
            data: [
              num(officer.stress_score) * 20,
              (5 - num(officer.mood_score)) * 20,
              (5 - num(officer.energy_score)) * 20,
              num(officer.fatigue_score),
              Math.max(0, (8 - num(officer.sleep_hours)) * 12),
            ],
            backgroundColor: ["#e07a2f", "#a6843d", "#c6a15b", "#1f6b4a", "#0e3b2e"],
            borderRadius: 6,
          },
        ],
      }}
      options={{ plugins: { legend: { display: false } }, scales, maintainAspectRatio: false }}
    />
  )
}

export function TrendChart({ series }) {
  return (
    <Line
      data={{
        labels: series.labels,
        datasets: [
          {
            label: "Risk",
            data: series.scores,
            borderColor: "#0e3b2e",
            backgroundColor: "rgba(14, 59, 46, 0.12)",
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#a6843d",
            pointRadius: 3,
          },
        ],
      }}
      options={{ plugins: { legend: { display: false } }, scales, maintainAspectRatio: false }}
    />
  )
}
