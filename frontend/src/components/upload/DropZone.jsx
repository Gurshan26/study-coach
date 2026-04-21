import { useRef, useState } from 'react';

export default function DropZone({ onFile }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (fileList) => {
    const file = fileList?.[0];
    if (file) {
      onFile(file);
    }
  };

  return (
    <div
      className={`card-shell paper-grain relative cursor-pointer overflow-hidden border-2 border-dashed p-8 transition ${
        dragActive ? 'border-primary bg-primary/12' : 'border-border bg-surface'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        handleFiles(event.dataTransfer.files);
      }}
      aria-label="Upload study material"
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          inputRef.current?.click();
        }
      }}
    >
      <div className="relative z-10 grid min-h-[320px] items-center gap-8 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-muted">Bring your lecture notes</p>
          <h2 className="mt-2 font-display text-4xl leading-tight text-text">Drop lecture notes here</h2>
          <p className="mt-3 max-w-xl text-sm text-text-muted">PDF, TXT, or MD up to 50MB. We will parse, build topics, quiz questions, and flashcards automatically.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-soft p-5">
          <p className="font-display text-xl text-text">Notebook Preview</p>
          <div className="mt-3 space-y-2">
            {new Array(6).fill(0).map((_, idx) => (
              <div key={idx} className="h-2 rounded-full bg-primary/25" />
            ))}
          </div>
          <p className="mt-4 text-xs text-text-muted">Tip: Drag directly from Finder for fastest upload.</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}
