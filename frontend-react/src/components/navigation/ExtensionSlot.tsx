interface ExtensionSlotProps {
  name: string;
}

export default function ExtensionSlot({ name }: ExtensionSlotProps) {
  return <div data-extension-slot={name} />;
}
