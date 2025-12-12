import React from 'react';
import { BODY_FAT_CATEGORIES_ACE } from '../../lib/constants/bodyCompositionReferenceData';

interface BodyFatReferenceTableProps {
  highlightedCategory?: string;
}

export function BodyFatReferenceTable({ highlightedCategory }: BodyFatReferenceTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Body fat %</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Men</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Women</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {BODY_FAT_CATEGORIES_ACE.map((row, index) => {
              const isHighlighted = highlightedCategory && row.category.toLowerCase().includes(highlightedCategory.toLowerCase());
              const isFitness = row.category === 'Fitness (in shape)';

              return (
                <tr
                  key={index}
                  className={`${
                    isHighlighted
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : isFitness
                      ? 'bg-green-50'
                      : 'bg-white'
                  } hover:bg-gray-50 transition-colors`}
                >
                  <td className="px-6 py-3 text-sm text-gray-900 font-medium">{row.category}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{row.men}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{row.women}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600 italic">Source: American Council on Exercise Guidelines</p>
      </div>
    </div>
  );
}
