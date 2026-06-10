import Input from '../ui/Input';

interface FriendsFilterBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function FriendsFilterBar({ value, onChange }: FriendsFilterBarProps) {
  return <Input aria-label="Tìm bạn Zalo" onChange={(event) => onChange(event.target.value)} placeholder="Tìm bạn Zalo..." value={value} />;
}
