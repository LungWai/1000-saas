import { useState } from 'react';
import { Grid as GridType } from '@/types';
import PurchaseModal from './PurchaseModal';
import { PRICING } from '@/lib/constants';

interface GridProps {
  grid: GridType;
  onClick?: () => void;
}

export default function Grid({ grid, onClick }: GridProps) {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const handleGridClick = () => {
    if (!grid.content && !grid.customerId) {
      setIsPurchaseModalOpen(true);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <>
      <div
        onClick={handleGridClick}
        className={`
          w-full aspect-square border border-gray-200 rounded-lg p-4
          ${!grid.content && !grid.customerId ? 'cursor-pointer hover:border-indigo-500' : ''}
          ${grid.content ? 'bg-white' : 'bg-gray-50'}
        `}
      >
        {grid.content ? (
          <div className="w-full h-full flex items-center justify-center">
            {grid.content}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {grid.customerId ? 'Reserved' : 'Available'}
          </div>
        )}
      </div>

      <PurchaseModal
        gridId={grid.id}
        price={PRICING.BASE_PRICE}
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />
    </>
  );
} 