import React from 'react';
import { FFMI_DESCRIPTION_CATEGORIES } from '../../lib/constants/bodyCompositionReferenceData';

interface FFMICategoryTableProps {
  userFFMI?: number | null;
  gender: string;
}

export function FFMICategoryTable({ userFFMI, gender }: FFMICategoryTableProps) {
  const isMale = gender === 'male';

  // Function to check if user's FFMI falls within a category
  const isUserInCategory = (category: typeof FFMI_DESCRIPTION_CATEGORIES[0]): boolean => {
    if (!userFFMI) return false;

    const range = isMale ? category.men : category.women;

    // Handle "< X" format
    if (range.startsWith('<')) {
      const threshold = parseFloat(range.replace('<', '').trim());
      return userFFMI < threshold;
    }
    // Handle "> X" format
    else if (range.startsWith('>')) {
      const threshold = parseFloat(range.replace('>', '').trim());
      return userFFMI > threshold;
    }
    // Handle "X–Y" format
    else if (range.includes('–')) {
      const [min, max] = range.split('–').map((v) => parseFloat(v.trim()));
      return userFFMI >= min && userFFMI <= max;
    }

    return false;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Description</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Men</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Women</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {FFMI_DESCRIPTION_CATEGORIES.map((row, index) => {
              const isHighlighted = isUserInCategory(row);

              return (
                <tr
                  key={index}
                  className={`${
                    isHighlighted
                      ? 'bg-blue-100 border-l-4 border-l-blue-600 font-semibold'
                      : row.colorClass || 'bg-white'
                  } hover:bg-gray-50 transition-colors`}
                >
                  <td className="px-4 py-3 text-gray-900">{row.description}</td>
                  <td className="px-4 py-3 text-gray-700">{row.men}</td>
                  <td className="px-4 py-3 text-gray-700">{row.women}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
