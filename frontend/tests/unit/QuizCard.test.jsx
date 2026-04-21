import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import QuizCard from '../../src/components/quiz/QuizCard.jsx';

const question = {
  question: 'What does backpropagation compute?',
  correct_answer: 'Gradients',
  distractors: ['Data', 'Epochs', 'Activations'],
  explanation: 'Backpropagation computes parameter gradients.'
};

describe('QuizCard', () => {
  it('renders question and 4 answers', () => {
    render(<QuizCard question={question} onAnswer={vi.fn()} />);

    expect(screen.getByText(question.question)).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: /Answer option/i });
    expect(buttons).toHaveLength(4);
  });

  it('clicking correct answer highlights green', async () => {
    const user = userEvent.setup();
    render(<QuizCard question={question} onAnswer={vi.fn()} />);

    const correct = screen.getByRole('button', { name: /Gradients/i });
    await user.click(correct);

    expect(correct.className).toContain('bg-success/30');
  });

  it('clicking wrong answer highlights red and reveals correct', async () => {
    const user = userEvent.setup();
    render(<QuizCard question={question} onAnswer={vi.fn()} />);

    const wrong = screen.getByRole('button', { name: /Data/i });
    await user.click(wrong);

    expect(wrong.className).toContain('bg-danger/30');
    const correct = screen.getByRole('button', { name: /Gradients/i });
    expect(correct.className).toContain('bg-success/30');
  });

  it('calls onAnswer with selected option', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();

    render(<QuizCard question={question} onAnswer={onAnswer} />);

    await user.click(screen.getByRole('button', { name: /Gradients/i }));

    expect(onAnswer).toHaveBeenCalledWith('Gradients');
  });
});
