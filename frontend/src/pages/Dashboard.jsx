import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, getStats } from '../api/client.js';
import { useStore } from '../store/useStore.js';
import DocumentList from '../components/upload/DocumentList.jsx';
import EmptyState from '../components/shared/EmptyState.jsx';
import Button from '../components/shared/Button.jsx';

function StatCard({ title, value, accent }) {
  return (
    <div className="card-shell paper-grain p-4">
      <div className="relative z-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">{title}</p>
        <p className={`mt-2 font-display text-4xl ${accent}`}>{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { documents, stats, setDocuments, setStats, addToast } = useStore();

  useEffect(() => {
    getDocuments()
      .then((response) => setDocuments(response.documents))
      .catch(() => addToast({ type: 'error', message: 'Unable to load documents.', action: 'Retry' }));

    getStats()
      .then((response) => setStats(response))
      .catch(() => addToast({ type: 'error', message: 'Unable to load stats.', action: 'Retry' }));
  }, [setDocuments, setStats, addToast]);

  const topWeak = (stats.topicBreakdown || []).slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Documents" value={documents.length} accent="text-text" />
        <StatCard title="Cards Due Today" value={stats.dueToday || 0} accent="text-primary" />
        <StatCard title="Study Streak" value={stats.streakDays || 0} accent="text-secondary" />
        <StatCard title="Overall Accuracy" value={`${Math.round((stats.overallAccuracy || 0) * 100)}%`} accent="text-accent" />
      </section>

      <section className="card-shell paper-grain p-6">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Continue studying</p>
            <h2 className="mt-1 font-display text-4xl text-text">Short bursts beat cramming.</h2>
            <p className="mt-2 max-w-xl text-sm text-text-muted">Review due cards first, then quickly close weak topics with a fresh quiz set.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/flashcards')}>Study Due Cards</Button>
            <Button variant="secondary" onClick={() => navigate('/quiz')}>Quick Quiz</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="card-shell p-4">
          <h3 className="mb-3 font-display text-2xl text-text">Recent Documents</h3>
          {documents.length ? (
            <DocumentList
              documents={documents}
              onOpenQuiz={(id) => navigate(`/quiz?docId=${id}`)}
              onOpenFlashcards={(id) => navigate(`/flashcards?docId=${id}`)}
              onOpenTopics={(id) => navigate(`/weak-topics?docId=${id}`)}
            />
          ) : (
            <EmptyState
              title="Upload your first lecture"
              description="Drag a PDF or notes file on the Upload page to generate quizzes and flashcards."
            />
          )}
        </div>

        <div className="card-shell p-4">
          <h3 className="font-display text-2xl text-text">Top Weak Topics</h3>
          <div className="mt-3 space-y-2">
            {topWeak.length ? (
              topWeak.map((topic) => (
                <div key={topic.topicId} className="rounded-2xl border border-border bg-surface-soft px-3 py-2.5">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-text">{topic.topic}</p>
                    <span className="text-xs text-text-muted">{Math.round(topic.weakScore * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface">
                    <div
                      className="h-2 rounded-full bg-danger/80"
                      style={{ width: `${Math.min(100, Math.round(topic.weakScore * 100))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted">No weak topics yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
