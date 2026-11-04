'use client';
import { X } from 'lucide-react';

interface Props {
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
  file: string | null;
  selected: boolean;
  eliminated: boolean;
  confirmed: boolean;
  isCorrect: boolean;
  disabled: boolean;
  onSelect: () => void;
  onEliminate: (e: React.MouseEvent) => void;
}

export default function AlternativeButton({
  letter,
  text,
  file,
  selected,
  eliminated,
  confirmed,
  isCorrect,
  disabled,
  onSelect,
  onEliminate,
}: Props) {
  const getContainerClass = () => {
    const base =
      'relative flex items-start gap-3 w-full border rounded-lg px-4 py-3.5 text-sm text-left transition-all group ';

    if (confirmed) {
      if (isCorrect) return base + 'border-correct-border bg-correct-bg text-correct-text';
      if (selected) return base + 'border-wrong-border bg-wrong-bg text-wrong-text';
      return base + 'border-border-soft bg-bg-primary text-text-meta opacity-60';
    }
    if (eliminated) return base + 'border-border-soft bg-bg-secondary text-text-meta opacity-50';
    if (selected) return base + 'border-action-main bg-bg-secondary text-text-main';
    return base + 'border-border-soft bg-bg-primary text-text-main hover:border-action-main cursor-pointer';
  };

  const getLetterClass = () => {
    const base = 'flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs font-bold border ';
    if (confirmed && isCorrect) return base + 'border-correct-text bg-correct-text text-bg-primary';
    if (confirmed && selected) return base + 'border-wrong-text bg-wrong-text text-bg-primary';
    if (selected) return base + 'border-action-main bg-action-main text-action-contrast';
    return base + 'border-border-soft bg-bg-primary text-text-meta';
  };

  return (
    <button
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      aria-label={`Alternativa ${letter}${eliminated ? ' (riscada)' : ''}`}
      onClick={onSelect}
      disabled={disabled}
      className={getContainerClass()}
    >
      <span className={getLetterClass()} aria-hidden="true">{letter}</span>

      <div
        className="flex-1"
        style={{
          lineHeight: 1.65,
          textDecoration: eliminated ? 'line-through' : 'none',
        }}
      >
        {file ? (
          <img
            src={file}
            alt={`Alternativa ${letter}`}
            className="max-h-32 object-contain mt-1"
          />
        ) : (
          <span>{text}</span>
        )}
      </div>

      {!confirmed && (
        <span
          onClick={onEliminate}
          role="button"
          aria-label={`${eliminated ? 'Desriscar' : 'Riscar'} alternativa ${letter}`}
          title={eliminated ? 'Desriscar alternativa' : 'Riscar alternativa'}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-bg-secondary"
        >
          <X size={14} strokeWidth={1.5} className="text-text-meta" />
        </span>
      )}
    </button>
  );
}
