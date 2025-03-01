import { GridHoverOverlayProps } from '@/types';

const GridHoverOverlay: React.FC<GridHoverOverlayProps> = ({
  price,
  isVisible,
  onPurchaseClick,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-white/90 to-white/95 flex flex-col items-center justify-center p-2 border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 ease-in-out">
      <div className="flex flex-col items-center">
        <p className="text-sm font-medium text-gray-800 mb-3">
          <span className="text-lg">${price}</span>
          <span className="text-xs font-normal text-gray-500 ml-1">/month</span>
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPurchaseClick();
          }}
          className="px-4 py-2 bg-black text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-all duration-200 hover:shadow-md"
        >
          Lease Grid
        </button>
      </div>
    </div>
  );
};

export default GridHoverOverlay; 