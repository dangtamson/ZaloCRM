import ActionEditor from '../../components/automation/ActionEditor';
import AutomationPageHeader from '../../components/automation/AutomationPageHeader';
import ConditionEditor from '../../components/automation/ConditionEditor';
import RuleBuilder from '../../components/automation/RuleBuilder';
import TemplateManager from '../../components/automation/TemplateManager';

export default function AutomationPage() {
  return (
    <section className="space-y-4">
      <AutomationPageHeader description="Rules & templates legacy được giữ để không làm gãy deep link cũ." title="Automation" />
      <div className="grid gap-4 lg:grid-cols-2">
        <RuleBuilder />
        <TemplateManager />
        <ActionEditor />
        <ConditionEditor />
      </div>
    </section>
  );
}
