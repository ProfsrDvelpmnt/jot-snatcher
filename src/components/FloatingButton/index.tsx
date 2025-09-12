import React from 'react';
import { FloatingButton } from './FloatingButton';
import { FloatingContent } from './FloatingContent';

export const FloatingButtonContainer: React.FC = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleToggle = (expanded: boolean) => {
    setIsExpanded(expanded);
  };

  const handleMinimize = () => {
    setIsExpanded(false);
  };

  return (
    <FloatingButton onToggle={handleToggle}>
      {isExpanded && <FloatingContent onMinimize={handleMinimize} />}
    </FloatingButton>
  );
};
