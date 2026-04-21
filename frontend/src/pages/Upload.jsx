import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DropZone from '../components/upload/DropZone.jsx';
import { uploadFile, getJob } from '../api/client.js';
import { useStore } from '../store/useStore.js';

const stepMeta = [
  { key: 'parsing', label: 'Parsing text' },
  { key: 'topics', label: 'Extracting topics' },
  { key: 'quiz', label: 'Generating questions' },
  { key: 'flashcards', label: 'Creating flashcards' }
];

export default function Upload() {
  const navigate = useNavigate();
  const { addToast } = useStore();
  const [job, setJob] = useState(null);
  const [fileName, setFileName] = useState('');

  const progress = useMemo(() => {
    if (!job?.steps) {
      return 0;
    }
    const done = Object.values(job.steps).filter((state) => state === 'done').length;
    return Math.round((done / stepMeta.length) * 100);
  }, [job]);

  const pollJob = async (jobId) => {
    const response = await getJob(jobId);
    setJob(response);

    if (response.status === 'completed') {
      setTimeout(() => {
        navigate(`/quiz?docId=${response.result.documentId}`);
      }, 700);
      return;
    }

    if (response.status === 'failed') {
      addToast({ type: 'error', message: response.error || 'Upload processing failed.', action: 'Retry' });
      return;
    }

    setTimeout(() => pollJob(jobId), 500);
  };

  const handleFile = async (file) => {
    setFileName(file.name);
    setJob(null);

    try {
      const response = await uploadFile(file);
      pollJob(response.jobId);
    } catch (error) {
      addToast({ type: 'error', message: error.response?.data?.error || 'Upload failed.', action: 'Retry' });
    }
  };

  return (
    <div className="space-y-6">
      <DropZone onFile={handleFile} />

      {fileName ? (
        <div className="card-shell p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate text-sm font-bold text-text">{fileName}</p>
            <p className="font-mono text-sm text-text-muted">{progress}%</p>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-surface-soft">
            <div className="h-2.5 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {stepMeta.map((step) => {
              const state = job?.steps?.[step.key] || 'pending';
              return (
                <div key={step.key} className="rounded-2xl border border-border bg-surface-soft p-3 text-sm">
                  <span className="font-semibold text-text">{step.label}</span>{' '}
                  <span
                    className={
                      state === 'done' ? 'text-success' : state === 'in_progress' ? 'text-accent' : 'text-text-muted'
                    }
                  >
                    {state === 'done' ? '✓' : state === 'in_progress' ? '…' : '·'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
