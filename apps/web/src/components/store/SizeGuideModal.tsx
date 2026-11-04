'use client';

import React, { useState } from 'react';
import { X, Ruler } from 'lucide-react';
import { SizeChart } from '@ramprs/shared';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeChart: SizeChart;
  productTitle: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  sizeChart,
  productTitle,
}) => {
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 sm:p-8 text-left shadow-2xl transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Ruler size={20} className="text-neutral-900" />
              <h3 className="text-base font-bold tracking-luxury uppercase text-black">
                RAMPRS Size & Fit Guide
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-black p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-xs text-neutral-500 mt-2">
            Measurements for <span className="font-semibold text-neutral-900">{productTitle}</span>.
            Compare these garment measurements against your best-fitting clothes.
          </p>

          {/* Unit Toggle */}
          <div className="flex justify-end my-4">
            <div className="inline-flex rounded-md border border-neutral-200 p-0.5 bg-neutral-100">
              <button
                onClick={() => setUnit('inches')}
                className={`px-3 py-1 text-xs font-bold rounded ${
                  unit === 'inches' ? 'bg-black text-white shadow-sm' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Inches (in)
              </button>
              <button
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 text-xs font-bold rounded ${
                  unit === 'cm' ? 'bg-black text-white shadow-sm' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-neutral-200 rounded-md">
            <table className="min-w-full divide-y divide-neutral-200 text-xs">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-neutral-900 uppercase">Size</th>
                  <th className="px-4 py-3 text-left font-bold text-neutral-900 uppercase">Chest</th>
                  <th className="px-4 py-3 text-left font-bold text-neutral-900 uppercase">Waist</th>
                  <th className="px-4 py-3 text-left font-bold text-neutral-900 uppercase">Length</th>
                  <th className="px-4 py-3 text-left font-bold text-neutral-900 uppercase">Shoulder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {sizeChart.measurements.map((m) => (
                  <tr key={m.size} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-bold text-black">{m.size}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {unit === 'inches' ? `${m.chest_in}"` : `${m.chest_cm} cm`}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {unit === 'inches' ? `${m.waist_in}"` : `${m.waist_cm} cm`}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {unit === 'inches' ? `${m.length_in}"` : `${m.length_cm} cm`}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {unit === 'inches' ? `${m.shoulder_in}"` : `${m.shoulder_cm} cm`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Model info & fit notes */}
          {(sizeChart.model_height || sizeChart.fit_notes) && (
            <div className="mt-4 p-4 bg-neutral-50 rounded border border-neutral-200 text-xs text-neutral-600 space-y-1">
              {sizeChart.model_height && (
                <p>
                  <span className="font-semibold text-neutral-900">Model Specs:</span> {sizeChart.model_height} wearing size {sizeChart.model_wearing_size || 'M'}.
                </p>
              )}
              {sizeChart.fit_notes && (
                <p>
                  <span className="font-semibold text-neutral-900">Fit Advice:</span> {sizeChart.fit_notes}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-neutral-900 text-white text-xs font-bold uppercase rounded hover:bg-black transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

