'use client';
import { useState, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { loadAnswers, clearAnswers } from '@/app/services/storageService';
import { UserAnswerRecord } from '@/app/types';

const STORAGE_KEY = 'enem_answers_v1';

interface Props {
  onImportComplete?: () => void;
}

export default function DataManager({ onImportComplete }: Props) {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = loadAnswers();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treino-enem-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as UserAnswerRecord[];

        if (!Array.isArray(imported)) {
          setImportStatus('Arquivo inválido: esperado um array de respostas.');
          return;
        }

        // Validar estrutura básica
        const isValid = imported.every(
          (r) =>
            r.id &&
            r.sessionId &&
            r.questionKey &&
            typeof r.isCorrect === 'boolean'
        );

        if (!isValid) {
          setImportStatus('Arquivo contém registros inválidos.');
          return;
        }

        // Merge: combina com dados existentes, evitando duplicatas por id
        const existing = loadAnswers();
        const existingIds = new Set(existing.map((a) => a.id));
        const newRecords = imported.filter((r) => !existingIds.has(r.id));

        const merged = [...existing, ...newRecords];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

        setImportStatus(`Importados ${newRecords.length} novos registros (${imported.length - newRecords.length} duplicatas ignoradas).`);
        onImportComplete?.();
      } catch {
        setImportStatus('Erro ao ler o arquivo JSON.');
      }
    };
    reader.readAsText(file);

    // Reset input para permitir reimportar o mesmo arquivo
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-text-meta hover:text-text-main border border-border-soft hover:border-action-main transition-colors"
      >
        <Download size={14} strokeWidth={1.5} />
        Exportar Dados
      </button>

      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-text-meta hover:text-text-main border border-border-soft hover:border-action-main transition-colors cursor-pointer">
        <Upload size={14} strokeWidth={1.5} />
        Importar Dados
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </label>

      {importStatus && (
        <span className="text-xs text-text-meta">{importStatus}</span>
      )}
    </div>
  );
}
