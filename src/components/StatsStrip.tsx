interface StatProps {
  value: string
  label: string
}

export default function StatsStrip({ stats }: { stats: StatProps[] }) {
  return (
    <div className="bg-neutral-800 py-12 text-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mb-2 text-4xl font-bold">{stat.value}</div>
              <div className="text-neutral-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
