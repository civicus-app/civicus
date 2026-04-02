import brandIcon from '../../assets/civicus-icon-transparent.png';
import { cn } from '../../lib/utils';

interface BrandMarkProps {
  className?: string;
  imageClassName?: string;
  alt?: string;
}

export default function BrandMark({
  className,
  imageClassName,
  alt = 'CIVICUS brand mark',
}: BrandMarkProps) {
  return (
    <div
      className={cn(
        'overflow-hidden border border-current/15 bg-white/90 p-[8%] shadow-[0_10px_30px_rgba(25,48,84,0.12)]',
        className
      )}
    >
      <img
        src={brandIcon}
        alt={alt}
        className={cn('block h-full w-full object-contain', imageClassName)}
      />
    </div>
  );
}
