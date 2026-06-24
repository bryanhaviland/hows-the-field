export default function AmenityRow({ label, value }: { label: string; value: boolean | null }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100">
      <span className="text-gray-600">{label}</span>
      {value === null ? (
        <span className="text-gray-300 text-xs">Unknown</span>
      ) : value ? (
        <span className="text-green-600 font-medium">✓ Yes</span>
      ) : (
        <span className="text-red-500 font-medium">✗ No</span>
      )}
    </div>
  )
}
