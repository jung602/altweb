import React from 'react';
import { X } from 'lucide-react';

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * 닫기 버튼 컴포넌트
 */
export const CloseButton: React.FC<CloseButtonProps> = ({
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`fixed top-4 right-4 z-50 rounded-full transition-colors ${className}`}
    >
      <X className="w-5 h-5 text-white hover:text-white/70" />
    </button>
  );
};

export default CloseButton; 