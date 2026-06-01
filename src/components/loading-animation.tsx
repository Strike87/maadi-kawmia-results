'use client';

import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

export function LoadingAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16 space-y-6"
    >
      <div className="relative">
        <motion.div
          className="h-20 w-20 rounded-full border-4 border-muted border-t-primary border-r-emerald-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
      </div>
      <motion.p
        className="text-lg font-black text-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        جاري البحث عن النتيجة...
      </motion.p>
    </motion.div>
  );
}
