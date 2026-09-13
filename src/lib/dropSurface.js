import { cn } from '@/lib/utils';

// One visual contract for every file intake surface. Questionnaire and evidence files
// do different work, but changing border weight, radius, width and spacing makes the
// journey feel like separate products.
export function dropSurfaceClass({ active = false, disabled = false, selected = false, className = '' } = {}) {
  return cn(
    'w-full min-h-[180px] cursor-pointer border-2 border-dashed bg-white p-8 text-center transition-colors',
    'flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
    active ? 'border-slate-900 bg-slate-50' : 'border-slate-300 hover:border-slate-500 hover:bg-slate-50/50',
    selected && 'border-solid border-slate-300',
    disabled && 'pointer-events-none opacity-60',
    className,
  );
}
