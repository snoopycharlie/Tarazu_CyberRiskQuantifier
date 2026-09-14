import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
  prefix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  format = (val) => val.toLocaleString(), 
  className = '',
  prefix = ''
}) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => {
    return prefix + format(current);
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  if (!isClient) {
    return <span className={className}>{prefix}{format(value)}</span>;
  }

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
};
