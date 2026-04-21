import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useWeakTopics } from '../hooks/useWeakTopics.js';
import WeakTopicCard from '../components/topics/WeakTopicCard.jsx';
import TopicHeatmap from '../components/topics/TopicHeatmap.jsx';
import Modal from '../components/shared/Modal.jsx';
import Button from '../components/shared/Button.jsx';

export default function WeakTopics() {
  const [params] = useSearchParams();
  const docId = params.get('docId');
  const weakTopics = useWeakTopics(docId);
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {weakTopics.map((topic) => (
          <WeakTopicCard key={topic.topicId} topic={topic} onSelect={setSelected} />
        ))}
      </div>

      <TopicHeatmap weakTopics={weakTopics} />

      <Modal open={Boolean(selected)} title={selected?.topic || 'Topic'} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface-soft p-3">
                <p className="text-xs text-text-muted">Weak score</p>
                <p className="text-xl font-bold text-text">{Math.round(selected.weakScore * 100)}%</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-soft p-3">
                <p className="text-xs text-text-muted">Quiz accuracy</p>
                <p className="text-xl font-bold text-text">{Math.round(selected.quizAccuracy * 100)}%</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-soft p-3">
                <p className="text-xs text-text-muted">Flashcard quality</p>
                <p className="text-xl font-bold text-text">{selected.flashcardAvgQuality.toFixed(2)}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-text">Recent quiz attempts</p>
              <div className="space-y-1.5">
                {selected.quizHistory.map((attempt, index) => (
                  <div key={index} className="rounded-xl border border-border bg-surface-soft p-2 text-xs text-text-muted">
                    {attempt.attempted_at}: {attempt.is_correct ? 'Correct' : 'Incorrect'}
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={() => (window.location.href = `/quiz?topic=${selected.topicId}`)}>Study this topic</Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
