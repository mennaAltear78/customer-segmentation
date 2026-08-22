import React from 'react';

interface SegmentBadgeProps {
  segment: string;
}

export const SegmentBadge: React.FC<SegmentBadgeProps> = ({ segment }) => {
  const normSegment = segment?.toLowerCase() || '';

  let classes = '';

  if (normSegment.includes('champions') || normSegment.includes('vip')) {
    classes = 'bg-[var(--color-vip-bg)] text-[var(--color-vip-text)] border-[var(--color-vip-border)]';
  } else if (
    normSegment.includes('loyal') ||
    normSegment.includes('potential')
  ) {
    classes = 'bg-[var(--color-loyal-bg)] text-[var(--color-loyal-text)] border-[var(--color-loyal-border)]';
  } else if (normSegment.includes('risk') || normSegment.includes('hibernating')) {
    classes = 'bg-[var(--color-risk-bg)] text-[var(--color-risk-text)] border-[var(--color-risk-border)]';
  } else {
    classes = 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border-[var(--color-danger-border)]';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      {segment || 'Unassigned'}
    </span>
  );
};
