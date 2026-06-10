import Button from '../ui/Button';

interface ContactColumnToggleProps {
  showScore: boolean;
  onToggleScore: () => void;
}

export default function ContactColumnToggle({ showScore, onToggleScore }: ContactColumnToggleProps) {
  return (
    <Button className="bg-slate-900 hover:bg-slate-800" onClick={onToggleScore}>
      {showScore ? 'Ẩn điểm' : 'Hiện điểm'}
    </Button>
  );
}
