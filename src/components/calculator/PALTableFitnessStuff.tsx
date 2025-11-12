import { activityLevelTranslations } from '@/lib/translations'

export default function PALTableFitnessStuff() {
  return (
    <div className="w-full">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-primary-300">
            <th className="text-left py-2 px-2 font-semibold text-neutral-700">Aktivitetsnivå</th>
            <th className="text-center py-2 px-2 font-semibold text-neutral-700">Värde</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-neutral-200">
            <td className="py-2 px-2">{activityLevelTranslations['Sedentary']}</td>
            <td className="text-center py-2 px-2 font-medium">1.2</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 px-2">{activityLevelTranslations['Lightly active']}</td>
            <td className="text-center py-2 px-2 font-medium">1.375</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 px-2">{activityLevelTranslations['Moderately active']}</td>
            <td className="text-center py-2 px-2 font-medium">1.55</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 px-2">{activityLevelTranslations['Very active']}</td>
            <td className="text-center py-2 px-2 font-medium">1.725</td>
          </tr>
          <tr>
            <td className="py-2 px-2">{activityLevelTranslations['Extremely active']}</td>
            <td className="text-center py-2 px-2 font-medium">1.9</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-4 text-xs text-neutral-600">
        <p className="font-medium mb-1">Plus träningskalorier från:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Träningsfrekvens per vecka</li>
          <li>Minuter per träningspass</li>
          <li>Dagliga steg</li>
        </ul>
      </div>
    </div>
  )
}
