export const UNITS = [
  {
    id: "capf",
    name: "Central Armed Police Group",
    forces: ["CRPF", "BSF", "CISF"],
    commander: { username: "commander", name: "Rajesh Rao", rank: "Commandant" },
    welfare: {
      username: "welfare",
      name: "Dr. Kavita Menon",
      qualification: "Mental health specialist",
    },
  },
  {
    id: "army",
    name: "Army and Rifles Group",
    forces: ["Indian Army", "Assam Rifles"],
    commander: { username: "cmd.army", name: "Vikram Singh", rank: "Colonel" },
    welfare: { username: "wlf.army", name: "Dr. Priya Shah", qualification: "Psychiatrist" },
  },
  {
    id: "sea-air",
    name: "Navy and Air Force Group",
    forces: ["Indian Navy", "Indian Air Force"],
    commander: { username: "cmd.sea", name: "Arjun Mehta", rank: "Captain" },
    welfare: {
      username: "wlf.sea",
      name: "Dr. Arun Bose",
      qualification: "Occupational physician",
    },
  },
  {
    id: "frontier",
    name: "Frontier Forces Group",
    forces: ["ITBP", "SSB"],
    commander: {
      username: "cmd.frontier",
      name: "Harjeet Kaur",
      rank: "Deputy Inspector General",
    },
    welfare: {
      username: "wlf.frontier",
      name: "Dr. Sameer Iqbal",
      qualification: "Clinical psychologist",
    },
  },
  {
    id: "state",
    name: "State Police Group",
    forces: ["Jharkhand Police", "Maharashtra Police", "Uttarakhand Police"],
    commander: { username: "cmd.state", name: "Anil Thakur", rank: "Superintendent of Police" },
    welfare: {
      username: "wlf.state",
      name: "Dr. Neelam Joshi",
      qualification: "Welfare medical officer",
    },
  },
]

export const FORCES = UNITS.flatMap((unit) => unit.forces)

export const STATES = [
  "Rajasthan",
  "Uttar Pradesh",
  "Madhya Pradesh",
  "Maharashtra",
  "Telangana",
  "Karnataka",
  "Tamil Nadu",
  "Kerala",
  "Gujarat",
  "Jharkhand",
  "Odisha",
  "Assam",
  "Chandigarh",
  "Uttarakhand",
  "Bihar",
  "Chhattisgarh",
]

export const DUTY_TYPES = [
  "Records office",
  "Hospital staff",
  "Recruitment office",
  "Ceremonial unit",
  "Family welfare cell",
  "District headquarters",
  "Training centre",
]

export function unitById(unitId) {
  return UNITS.find((unit) => unit.id === unitId) || null
}

export function unitIdForForce(forceName) {
  return UNITS.find((unit) => unit.forces.includes(forceName))?.id || "state"
}

export function unitForOfficer(officer) {
  if (officer?.unitId) return unitById(officer.unitId) || unitById(unitIdForForce(officer.force_name))
  return unitById(unitIdForForce(officer?.force_name))
}

export function leadership(unitId, users = []) {
  const unit = unitById(unitId)
  if (!unit) return { unit: null, commander: null, welfare: null }
  const commander = users.find((user) => user.role === "COMMANDER" && user.unitId === unitId)
  const welfare = users.find((user) => user.role === "WELFARE" && user.unitId === unitId)
  return {
    unit,
    commander: commander || { name: unit.commander.name, rank: unit.commander.rank },
    welfare: welfare || { name: unit.welfare.name, qualification: unit.welfare.qualification },
  }
}
