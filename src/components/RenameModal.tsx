import React, { useEffect, useRef, useState } from 'react';
import { sanitizePetName } from '../game/logic';

interface RenameModalProps {
  open: boolean;
  currentName: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  open,
  currentName,
  onCancel,
  onSave,
}) => {
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(currentName);
      setError('');
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
      return () => window.clearTimeout(timer);
    }
  }, [open, currentName]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizePetName(value);
    if (!cleaned) {
      setError('Enter 1-10 letters or numbers.');
      return;
    }
    onSave(cleaned);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07100c]/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-modal-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[340px] bg-[#242e4f] border-4 border-[#0a0c14] rounded-xl p-5 shadow-[0_12px_0_rgba(0,0,0,0.5)] flex flex-col gap-4 text-center"
      >
        <h2 id="rename-modal-title" className="text-[11px] text-amber-200 leading-relaxed">
          NAME YOUR KITTY
        </h2>

        <div className="flex flex-col gap-2">
          <label htmlFor="kitty-name-input" className="sr-only">
            Kitty name
          </label>
          <input
            id="kitty-name-input"
            ref={inputRef}
            type="text"
            maxLength={10}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError('');
            }}
            className="pixel-input"
            placeholder="MOCHI"
            autoComplete="off"
          />
          {error && (
            <p className="text-[8px] text-rose-300 leading-relaxed" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <button type="button" onClick={onCancel} className="px-btn !text-[9px]">
            CANCEL
          </button>
          <button type="submit" className="px-btn px-btn-green !text-[9px]">
            SAVE
          </button>
        </div>
      </form>
    </div>
  );
};
