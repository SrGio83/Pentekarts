import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface CountdownProps {
  targetDate: string;
  onExpire?: () => void;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        if (onExpire) onExpire();
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    const updateTimer = () => {
      const tl = calculateTimeLeft();
      setTimeLeft(tl);
    };

    const timer = setInterval(updateTimer, 1000);
    updateTimer();

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (!timeLeft) return null;

  return (
    <div className="flex gap-4 md:gap-8">
      {[
        { label: 'DÍAS', value: timeLeft.days },
        { label: 'HRS', value: timeLeft.hours },
        { label: 'MIN', value: timeLeft.minutes },
        { label: 'SEG', value: timeLeft.seconds },
      ].map((item, index) => (
        <div key={item.label} className="flex flex-col items-center w-12 md:w-20">
          <motion.div 
            key={item.value}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-5xl font-f1-bold italic tracking-tighter text-f1-red tabular-nums"
          >
            {item.value.toString().padStart(2, '0')}
          </motion.div>
          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Countdown;
