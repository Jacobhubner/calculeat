import React from 'react';
import { FFMI_WITH_BODY_FAT_RANGES } from '../../lib/constants/bodyCompositionReferenceData';

interface FFMIReferenceTableProps {
  userFFMI?: number | null;
  userBodyFat?: number | null;
  gender: string;
}

export function FFMIReferenceTable({ userFFMI, userBodyFat, gender }: FFMIReferenceTableProps) {
  const isMale = gender === 'male';

  // Function to check if user's values fall within a range
  const isUserInRange = (row: typeof FFMI_WITH_BODY_FAT_RANGES[0]): boolean => {
    if (!userFFMI || !userBodyFat) return false;

    const ffmiRange = isMale ? row.ffmiMen : row.ffmiWomen;
    const bfRange = isMale ? row.bodyFatMen : row.bodyFatWomen;

    // Parse FFMI range
    const [ffmiMin, ffmiMax] = ffmiRange.split('–').map((v) => parseFloat(v.trim()));

    // Parse body fat range
    const bfRangeCleaned = bfRange.replace('%', '');
    const [bfMin, bfMax] = bfRangeCleaned.split('–').map((v) => parseFloat(v.trim()));

    // Check if both values fall within the range
    return userFFMI >= ffmiMin && userFFMI <= ffmiMax && userBodyFat >= bfMin && userBodyFat <= bfMax;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          <span className="text-orange-600">Fat Fri Mass Index</span> (FFMI)
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2 text-left font-semibold text-gray-900" colSpan={2}>
                Men
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900" colSpan={2}>
                Women
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900" rowSpan={2}>
                Description
              </th>
            </tr>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs">
              <th className="px-4 py-2 text-left font-medium text-gray-700">FFMI</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Body fat</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">FFMI</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Body fat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {FFMI_WITH_BODY_FAT_RANGES.map((row, index) => {
              const isHighlighted = isUserInRange(row);

              return (
                <tr
                  key={index}
                  className={`${
                    isHighlighted
                      ? 'bg-blue-100 border-l-4 border-l-blue-600 font-semibold'
                      : row.colorClass || 'bg-white'
                  } hover:bg-gray-50 transition-colors`}
                >
                  <td className="px-4 py-3 text-gray-900">{row.ffmiMen}</td>
                  <td className="px-4 py-3 text-gray-700">{row.bodyFatMen}</td>
                  <td className="px-4 py-3 text-gray-900">{row.ffmiWomen}</td>
                  <td className="px-4 py-3 text-gray-700">{row.bodyFatWomen}</td>
                  <td className="px-4 py-3 text-gray-900">{row.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
