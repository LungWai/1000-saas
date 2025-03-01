import { GridProps } from '@/types';
import GridHoverOverlay from './GridHoverOverlay';
import { GRID_CONFIG } from '@/lib/constants';

interface ExtendedGridProps extends GridProps {
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const GridItem: React.FC<ExtendedGridProps> = ({
  id,
  status,
  price,
  imageUrl,
  title,
  description,
  externalUrl,
  onPurchaseClick,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}) => {
  const isEmpty = status === 'empty';
  
  return (
    <div
      className={`relative aspect-square transition-transform duration-${GRID_CONFIG.HOVER_ANIMATION_DURATION} ${
        isHovered ? `scale-${GRID_CONFIG.HOVER_SCALE} z-10` : ''
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-grid-id={id}
      data-grid-status={status}
    >
      <div
        className={`w-full h-full border border-black ${
          isHovered ? 'shadow-md' : ''
        }`}
        style={{ 
          backgroundColor: GRID_CONFIG.EMPTY_GRID_COLOR,
          width: GRID_CONFIG.BREAKPOINTS.lg.size,
          height: GRID_CONFIG.BREAKPOINTS.lg.size
        }}
      >
        {!isEmpty && (
          <>
            {imageUrl && (
              <img
                src={imageUrl}
                alt={title || 'Grid content'}
                className="w-full h-full object-cover"
              />
            )}
            {title && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                <p className="text-white text-xs truncate">{title}</p>
              </div>
            )}
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </>
        )}
      </div>

      {isEmpty && isHovered && (
        <GridHoverOverlay
          price={price}
          isVisible={isHovered}
          onPurchaseClick={onPurchaseClick}
        />
      )}
    </div>
  );
};

export default GridItem; 