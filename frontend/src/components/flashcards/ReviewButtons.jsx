import Button from '../shared/Button.jsx';

const options = [
  { label: 'Blackout (0)', quality: 0, variant: 'danger' },
  { label: 'Hard (2)', quality: 2, variant: 'ghost' },
  { label: 'Good (3)', quality: 3, variant: 'success' },
  { label: 'Easy (5)', quality: 5, variant: 'primary' }
];

export default function ReviewButtons({ onRate }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
      {options.map((option) => (
        <Button
          key={option.quality}
          variant={option.variant}
          onClick={() => onRate(option.quality)}
          aria-label={`Rate ${option.label}`}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
