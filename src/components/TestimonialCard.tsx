interface TestimonialCardProps {
  quote: string
  author: string
  role: string
}

export default function TestimonialCard({ quote, author, role }: TestimonialCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-lg dark:bg-neutral-850">
      <p className="mb-4 text-neutral-700 dark:text-neutral-200">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="font-semibold text-neutral-900 dark:text-neutral-100">{author}</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{role}</p>
      </div>
    </div>
  )
}
