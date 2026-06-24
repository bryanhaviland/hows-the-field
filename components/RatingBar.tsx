export default function RatingBar({ label, value }: { label: string; value: number }) {
  const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-lime-500', 'bg-green-500']
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
      <span className="text-sm text-gray-600 w-36 shrink-0">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-2 w-6 rounded-sm ${i <= value ? colors[value] : 'bg-gray-200'}`} />
        ))}
      </div>
      <span className="text-xs text-gray-400">{value}/5</span>
    </div>
  )
}
