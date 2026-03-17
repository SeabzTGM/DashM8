import type { DashboardData } from "./types"
import { PlaceholderCard, SectionTitle, StatCard, StatGrid, Table } from "./shared"

export function OperationsTab({ data }: { data: DashboardData }) {
  const jobsCompleted = data.jobs.filter((job) => job.completedAt).length
  const totalJobs = data.jobs.length || 1
  const onTimeCompletionRate = Math.round((jobsCompleted / totalJobs) * 100)

  return (
    <div>
      <StatGrid>
        <StatCard title="First-Time Fix Rate" value="—" subtitle="Needs callback / revisit tracking" />
        <StatCard title="Return Visit Rate" value="—" subtitle="Needs repeat-visit job linking" />
        <StatCard title="Rework Percentage" value="—" subtitle="Needs rework classification" />
        <StatCard title="Quote-to-Job Conversion" value="—" subtitle="Needs quote records in sync" />
        <StatCard title="On-Time Completion" value={`${onTimeCompletionRate}%`} subtitle="Temporary placeholder metric" />
        <StatCard title="Travel vs Job Time" value="—" subtitle="Needs travel duration data" />
        <StatCard title="Avg Time Onsite" value="—" subtitle="Needs onsite duration tracking" />
        <StatCard title="Utilisation Rate" value="—" subtitle="Needs staff capacity data" />
      </StatGrid>

      <SectionTitle>Operational Notes</SectionTitle>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <PlaceholderCard
          title="Next data model additions"
          description="Add scheduled start/end, actual start/end, travel duration, onsite duration, callback flag, quote stage, and staff availability hours."
        />
        <PlaceholderCard
          title="Best first operational metrics"
          description="On-time completion rate, average onsite time per staff member, quote conversion rate, and utilisation by staff."
        />
      </div>

      <SectionTitle>Per-Staff Operational Table</SectionTitle>
      <Table
        columns={["Staff", "Completed Jobs", "Operational Status"]}
        rows={data.staff.map((staff) => {
          const completedJobs = data.jobs.filter(
            (job) => job.assignedStaffId === staff.id && job.completedAt
          ).length
          return {
            Staff: [staff.firstName, staff.lastName].filter(Boolean).join(" ") || staff.email || "Unknown",
            "Completed Jobs": completedJobs,
            "Operational Status": "Awaiting richer field mapping",
          }
        })}
      />
    </div>
  )
}
