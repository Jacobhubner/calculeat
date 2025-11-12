import { activityLevelTranslations, intensityLevelTranslations } from '@/lib/translations'

export default function PALTableDAMNRIPPED() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-xs sm:text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-primary-300">
            <th className="text-left py-2 px-1 sm:px-2 font-semibold text-neutral-700">
              Aktivitet
            </th>
            <th className="text-center py-2 px-1 sm:px-2 font-semibold text-neutral-700">
              {intensityLevelTranslations['None']}
            </th>
            <th className="text-center py-2 px-1 sm:px-2 font-semibold text-neutral-700">
              {intensityLevelTranslations['Light']}
            </th>
            <th className="text-center py-2 px-1 sm:px-2 font-semibold text-neutral-700">
              {intensityLevelTranslations['Moderate']}
            </th>
            <th className="text-center py-2 px-1 sm:px-2 font-semibold text-neutral-700">
              {intensityLevelTranslations['Difficult']}
            </th>
            <th className="text-center py-2 px-1 sm:px-2 font-semibold text-neutral-700">
              {intensityLevelTranslations['Intense']}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-neutral-200">
            <td className="py-2 px-1 sm:px-2">{activityLevelTranslations['Sedentary']}</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.1</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.2</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.35</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.45</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.55</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 px-1 sm:px-2">{activityLevelTranslations['Lightly active']}</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.2</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.4</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.45</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.55</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.6</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 px-1 sm:px-2">{activityLevelTranslations['Moderately active']}</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.4</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.45</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.6</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.65</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.7</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 px-1 sm:px-2">{activityLevelTranslations['Very active']}</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.6</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.7</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.75</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.8</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.9</td>
          </tr>
          <tr>
            <td className="py-2 px-1 sm:px-2">{activityLevelTranslations['Extremely active']}</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.8</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">1.9</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">2.0</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">2.1</td>
            <td className="text-center py-2 px-1 sm:px-2 font-medium">2.2</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
