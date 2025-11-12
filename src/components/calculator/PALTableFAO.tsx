import { activityLevelTranslations } from '@/lib/translations'

export default function PALTableFAO() {
  return (
    <div className="w-full">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-primary-300">
            <th className="text-left py-2 px-2 font-semibold text-neutral-700">Aktivitetsnivå</th>
            <th className="text-center py-2 px-2 font-semibold text-neutral-700">Män</th>
            <th className="text-center py-2 px-2 font-semibold text-neutral-700">Kvinnor</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-neutral-200">
            <td className="py-2 px-2">{activityLevelTranslations['Sedentary']}</td>
            <td className="text-center py-2 px-2 font-medium">1.3</td>
            <td className="text-center py-2 px-2 font-medium">1.3</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 px-2">{activityLevelTranslations['Lightly active']}</td>
            <td className="text-center py-2 px-2 font-medium">1.6</td>
            <td className="text-center py-2 px-2 font-medium">1.5</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 px-2">{activityLevelTranslations['Moderately active']}</td>
            <td className="text-center py-2 px-2 font-medium">1.7</td>
            <td className="text-center py-2 px-2 font-medium">1.6</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 px-2">{activityLevelTranslations['Very active']}</td>
            <td className="text-center py-2 px-2 font-medium">2.1</td>
            <td className="text-center py-2 px-2 font-medium">1.9</td>
          </tr>
          <tr>
            <td className="py-2 px-2">{activityLevelTranslations['Extremely active']}</td>
            <td className="text-center py-2 px-2 font-medium">2.4</td>
            <td className="text-center py-2 px-2 font-medium">2.2</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
