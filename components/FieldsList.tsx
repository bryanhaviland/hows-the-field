import { Field } from '@/lib/supabase'

const surfaceLabel: Record<string, string> = {
  grass: 'Grass', grass_clay: 'Grass/Clay', clay: 'Clay', turf: 'Turf',
}
const surfaceColor: Record<string, string> = {
  grass: 'bg-green-100 text-green-700',
  grass_clay: 'bg-lime-100 text-lime-700',
  clay: 'bg-orange-100 text-orange-700',
  turf: 'bg-blue-100 text-blue-700',
}

interface Props {
  fields: Field[]
  onLeaveNote?: (fieldId: string) => void
}

export default function FieldsList({ fields, onLeaveNote }: Props) {
  return (
    <div className="divide-y divide-gray-100">
      {fields.map(f => (
        <div key={f.id} className="py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-medium text-sm text-gray-800 w-20 shrink-0">{f.field_name}</span>

          {f.field_surface && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${surfaceColor[f.field_surface]}`}>
              {surfaceLabel[f.field_surface]}
            </span>
          )}
          {f.outfield_depth && (
            <span className="text-xs text-gray-500">OF: {f.outfield_depth}</span>
          )}
          {f.backstop && (
            <span className="text-xs text-gray-500">Backstop: {f.backstop}</span>
          )}
          {f.dugout_size && (
            <span className="text-xs text-gray-500">Dugout: {f.dugout_size}</span>
          )}
          {f.dugout_material && (
            <span className="text-xs text-gray-500 capitalize">{f.dugout_material.replace('_', ' ')}</span>
          )}
          <div className="flex gap-2 ml-auto">
            {f.covered_dugouts !== null && (
              <span className={`text-xs ${f.covered_dugouts ? 'text-green-600' : 'text-gray-400'}`}>
                {f.covered_dugouts ? '✓ Covered dug' : '✗ Open dug'}
              </span>
            )}
            {f.covered_stands !== null && (
              <span className={`text-xs ${f.covered_stands ? 'text-green-600' : 'text-gray-400'}`}>
                {f.covered_stands ? '✓ Covered stands' : '✗ Open stands'}
              </span>
            )}
            {f.dugouts_block_view !== null && f.dugouts_block_view && (
              <span className="text-xs text-amber-600">⚠ Blocked view</span>
            )}
            {onLeaveNote && (
              <button
                onClick={() => onLeaveNote(f.id)}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap"
              >
                💬 Leave a note on this field
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
