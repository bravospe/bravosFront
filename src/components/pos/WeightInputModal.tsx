'use client';

import { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { XMarkIcon, BackspaceIcon } from '@heroicons/react/24/outline';
import type { Product } from '@/types';
import clsx from 'clsx';

interface WeightInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (weight: number) => void;
  product: Product | null;
}

const WeightInputModal = ({ isOpen, onClose, onConfirm, product }: WeightInputModalProps) => {
  // Guardamos el valor como un string de números enteros (décimas)
  const [rawValue, setRawValue] = useState('0');

  useEffect(() => {
    if (isOpen) {
      setRawValue('0');
    }
  }, [isOpen]);

  if (!product) return null;

  const unitAbbr = product.unit_code || 'KG';
  const price = Number(product.sale_price);

  // Formatear el valor: "15" -> "1.5", "5" -> "0.5"
  const formatValue = (raw: string) => {
    const num = parseInt(raw, 10) || 0;
    return (num / 10).toFixed(1);
  };

  const handleNumber = (num: string) => {
    setRawValue((prev) => {
      const next = prev === '0' ? num : prev + num;
      // Limitar a 6 dígitos
      return next.length > 6 ? prev : next;
    });
  };

  const handleBackspace = () => {
    setRawValue((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setRawValue('0');
  };

  const displayValue = formatValue(rawValue);
  const currentWeight = parseFloat(displayValue);
  const totalPrice = currentWeight * price;

  const KeyButton = ({ label, onClick, className, variant = 'secondary' }: any) => (
    <button
      onClick={onClick}
      className={clsx(
        "h-12 text-xl font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-sm border",
        variant === 'primary' 
          ? "bg-emerald-500 text-black border-emerald-400" 
          : "bg-white dark:bg-[#1E2230] text-gray-900 dark:text-white border-gray-200 dark:border-[#232834]",
        className
      )}
    >
      {label}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Peso: ${product.name}`}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        {/* Display Panel */}
        <div className="bg-gray-900 dark:bg-black p-4 rounded-2xl border-2 border-emerald-500/30">
          <div className="flex justify-between items-center mb-1">
            <span className="text-emerald-500/70 text-[10px] font-black uppercase tracking-widest">Cantidad ({unitAbbr})</span>
            <span className="text-gray-500 text-[10px]">P.U. S/ {price.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-4xl font-black text-white tabular-nums tracking-tighter">
              {displayValue}
            </span>
            <span className="text-lg font-bold text-emerald-500 uppercase">{unitAbbr}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-800 flex justify-between items-center">
            <span className="text-gray-500 text-xs font-medium">Subtotal:</span>
            <span className="text-xl font-black text-emerald-400">S/ {totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <KeyButton key={num} label={num.toString()} onClick={() => handleNumber(num.toString())} />
          ))}
          <KeyButton 
            label="C" 
            onClick={handleClear} 
            className="text-amber-500 bg-amber-50/5 border-amber-500/20"
          />
          <KeyButton label="0" onClick={() => handleNumber('0')} />
          <KeyButton 
            label={<BackspaceIcon className="w-6 h-6" />} 
            onClick={handleBackspace}
            className="text-red-500"
          />
          
          <button
            onClick={() => onConfirm(currentWeight)}
            disabled={currentWeight <= 0}
            className={clsx(
              "col-span-3 h-14 text-lg font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg mt-1",
              currentWeight > 0
                ? "bg-emerald-500 text-black shadow-emerald-500/20"
                : "bg-gray-200 dark:bg-[#232834] text-gray-400 cursor-not-allowed"
            )}
          >
            CONFIRMAR S/ {totalPrice.toFixed(2)}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WeightInputModal;
