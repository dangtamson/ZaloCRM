import Button from '../ui/Button';

interface RichTextEditorProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function RichTextEditor({ value, disabled, onChange, onSubmit }: RichTextEditorProps) {
  return (
    <div className="flex gap-2">
      <input
        className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Nhập tin nhắn..."
        value={value}
      />
      <Button disabled={disabled} onClick={onSubmit}>Gửi</Button>
    </div>
  );
}
