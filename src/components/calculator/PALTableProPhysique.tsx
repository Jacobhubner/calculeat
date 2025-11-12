import { activityLevelTranslations, intensityLevelTranslations } from '@/lib/translations'

export default function PALTableProPhysique() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Grundvärden */}
      <div>
        <p className="font-semibold text-sm mb-2 text-neutral-700">Grundvärden (Aktivitetsnivå)</p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-primary-300">
              <th className="text-left py-2 px-2 font-semibold text-neutral-700">Aktivitet</th>
              <th className="text-center py-2 px-2 font-semibold text-neutral-700">Värde</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-200">
              <td className="py-2 px-2">{activityLevelTranslations['Sedentary']}</td>
              <td className="text-center py-2 px-2 font-medium">1.15</td>
            </tr>
            <tr className="border-b border-neutral-200">
              <td className="py-2 px-2">{activityLevelTranslations['Lightly active']}</td>
              <td className="text-center py-2 px-2 font-medium">1.25</td>
            </tr>
            <tr className="border-b border-neutral-200">
              <td className="py-2 px-2">{activityLevelTranslations['Moderately active']}</td>
              <td className="text-center py-2 px-2 font-medium">1.35</td>
            </tr>
            <tr>
              <td className="py-2 px-2">{activityLevelTranslations['Very active']}</td>
              <td className="text-center py-2 px-2 font-medium">1.4</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Träningsintensitet */}
      <div>
        <p className="font-semibold text-sm mb-2 text-neutral-700">
          Träningsintensitet (kcal/session)
        </p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-primary-300">
              <th className="text-left py-2 px-2 font-semibold text-neutral-700">Intensitet</th>
              <th className="text-center py-2 px-2 font-semibold text-neutral-700">Värde</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-200">
              <td className="py-2 px-2">{intensityLevelTranslations['Light']}</td>
              <td className="text-center py-2 px-2 font-medium">5</td>
            </tr>
            <tr className="border-b border-neutral-200">
              <td className="py-2 px-2">{intensityLevelTranslations['Moderate']}</td>
              <td className="text-center py-2 px-2 font-medium">7.5</td>
            </tr>
            <tr className="border-b border-neutral-200">
              <td className="py-2 px-2">{intensityLevelTranslations['Difficult']}</td>
              <td className="text-center py-2 px-2 font-medium">10</td>
            </tr>
            <tr>
              <td className="py-2 px-2">{intensityLevelTranslations['Intense']}</td>
              <td className="text-center py-2 px-2 font-medium">12</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
