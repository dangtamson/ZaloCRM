import { Plus, Trash2 } from 'lucide-react';
import type { AutomationBlock, SequenceStep } from '../types';

interface SequenceStepEditorProps {
  steps: SequenceStep[];
  blocks: AutomationBlock[];
  onChange: (steps: SequenceStep[]) => void;
}

function createStep(blockId: string): SequenceStep {
  return { stepId: crypto.randomUUID(), blockId, delayMinutes: 30 };
}

export default function SequenceStepEditor({ steps, blocks, onChange }: SequenceStepEditorProps) {
  function addStep() {
    onChange([...steps, createStep(blocks[0]?.id ?? '')]);
  }

  function updateStep(idx: number, patch: Partial<SequenceStep>) {
    onChange(steps.map((step, index) => (index === idx ? { ...step, ...patch } : step)));
  }

  function removeStep(idx: number) {
    onChange(steps.filter((_, index) => index !== idx));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-950">Bước sequence</h3>
        <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={addStep} type="button">
          <Plus size={16} />
          Thêm bước
        </button>
      </div>
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={step.stepId}>
            <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Block</span>
                <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3" value={step.blockId} onChange={(e) => updateStep(idx, { blockId: e.target.value })}>
                  <option value="">Chọn block</option>
                  {blocks.map((block) => <option key={block.id} value={block.id}>{block.name}</option>)}
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Delay phút</span>
                <input className="h-10 w-full rounded-md border border-slate-200 bg-white px-3" type="number" min="0" value={step.delayMinutes} onChange={(e) => updateStep(idx, { delayMinutes: Number(e.target.value) })} />
              </label>
              <div className="flex items-end">
                <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => removeStep(idx)} type="button">
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
