<template>
  <v-dialog :model-value="modelValue" max-width="720" persistent @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">{{ ACTION_TYPE_ICONS[draft.actionType] }}</v-icon>
        {{ isEdit ? 'Sửa Block' : 'Tạo Block mới' }}
        <v-spacer />
        <v-btn icon variant="text" @click="$emit('update:modelValue', false)"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>

      <v-card-text>
        <v-text-field v-model="draft.name" label="Tên block" variant="outlined" density="comfortable" class="mb-3" />

        <v-select
          v-model="draft.actionType"
          :items="actionTypeItems"
          item-title="label"
          item-value="value"
          label="Loại action"
          variant="outlined"
          density="comfortable"
          class="mb-3"
          :disabled="isEdit"
          :hint="isEdit ? 'Không đổi action type khi edit để giữ snapshot nhất quán' : 'Phase này: 3 loại action'"
          persistent-hint
        />

        <v-select
          v-model="draft.folderId"
          :items="folderItems"
          item-title="name"
          item-value="id"
          label="Folder (tổ chức)"
          variant="outlined"
          density="comfortable"
          clearable
          class="mb-3"
        />

        <!-- request_friend: greetingVariants -->
        <template v-if="draft.actionType === 'request_friend'">
          <div class="text-subtitle-2 mb-2">Lời chào kết bạn (nhiều variant để tránh detect spam)</div>
          <v-textarea
            v-for="(v, idx) in greetingVariants"
            :key="idx"
            :model-value="v"
            :label="`Variant ${idx + 1}`"
            variant="outlined"
            rows="2"
            class="mb-2"
            @update:model-value="updateGreeting(idx, $event)"
          >
            <template #append-inner>
              <v-btn v-if="greetingVariants.length > 1" icon variant="text" size="small" @click="removeGreeting(idx)">
                <v-icon size="small">mdi-close</v-icon>
              </v-btn>
            </template>
          </v-textarea>
          <v-btn variant="text" size="small" prepend-icon="mdi-plus" @click="addGreeting">Thêm variant</v-btn>
        </template>

        <!-- send_message: textVariants + attachments -->
        <template v-else-if="draft.actionType === 'send_message'">
          <div class="text-subtitle-2 mb-2">Nội dung tin (variants)</div>
          <v-textarea
            v-for="(v, idx) in textVariants"
            :key="idx"
            :model-value="v"
            :label="`Variant ${idx + 1}`"
            variant="outlined"
            rows="3"
            class="mb-2"
            @update:model-value="updateText(idx, $event)"
          >
            <template #append-inner>
              <v-btn v-if="textVariants.length > 1" icon variant="text" size="small" @click="removeText(idx)">
                <v-icon size="small">mdi-close</v-icon>
              </v-btn>
            </template>
          </v-textarea>
          <v-btn variant="text" size="small" prepend-icon="mdi-plus" @click="addText">Thêm variant</v-btn>

          <div class="text-subtitle-2 mt-4 mb-2">Đính kèm (optional)</div>
          <div v-for="(att, idx) in attachments" :key="idx" class="d-flex gap-2 mb-2 align-center">
            <v-select :model-value="att.kind" :items="['image','video','file','link']" label="Kiểu" variant="outlined" density="compact" style="max-width: 110px" @update:model-value="att.kind = $event" />
            <v-text-field :model-value="att.url" label="URL" variant="outlined" density="compact" @update:model-value="att.url = $event" />
            <v-text-field :model-value="att.caption" label="Caption" variant="outlined" density="compact" @update:model-value="att.caption = $event" />
            <v-btn icon variant="text" size="small" @click="attachments.splice(idx, 1)"><v-icon size="small">mdi-close</v-icon></v-btn>
          </div>
          <v-btn variant="text" size="small" prepend-icon="mdi-plus" @click="attachments.push({ kind: 'image', url: '', caption: '' })">Thêm đính kèm</v-btn>

          <v-divider class="my-4" />
          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2" color="teal">mdi-card-account-details-outline</v-icon>
            <span class="text-subtitle-2">Template Ảnh</span>
            <v-spacer />
            <v-switch v-model="htmlImageEnabled" color="teal" base-color="grey-lighten-1" density="compact" hide-details inset class="automation-toggle automation-toggle--teal" />
          </div>
          <template v-if="htmlImageEnabled">
            <div class="html-template-controls mb-2">
              <v-select
                v-model="htmlTemplatePreset"
                :items="htmlTemplatePresetItems"
                item-title="label"
                item-value="value"
                label="Mẫu template"
                variant="outlined"
                density="compact"
                clearable
                hide-details
                class="html-template-controls__select"
              />
              <div class="html-template-controls__actions">
                <v-btn
                  variant="tonal"
                  color="teal"
                  prepend-icon="mdi-eye-outline"
                  @click="htmlPreviewEnabled = !htmlPreviewEnabled"
                >
                  {{ htmlPreviewEnabled ? 'Ẩn preview' : 'View trước' }}
                </v-btn>
                <v-btn
                  variant="text"
                  color="teal"
                  :prepend-icon="htmlTemplateEditorExpanded ? 'mdi-chevron-up' : 'mdi-code-tags'"
                  @click="htmlTemplateEditorExpanded = !htmlTemplateEditorExpanded"
                >
                  {{ htmlTemplateEditorExpanded ? 'Ẩn SVG' : 'Mở SVG' }}
                </v-btn>
              </div>
            </div>
            <div class="html-template-editor-summary mb-2">
              <span>SVG template</span>
              <span>{{ htmlTemplate.length.toLocaleString('vi-VN') }} ký tự</span>
            </div>
            <v-expand-transition>
              <div v-if="htmlTemplateEditorExpanded">
                <v-textarea
                  v-model="htmlTemplate"
                  label="SVG template"
                  variant="outlined"
                  rows="6"
                  auto-grow
                  hint="Bắt đầu bằng <svg>. Biến hỗ trợ: {{contact.salutation}}, {{contact.fullName}}, {{contact.birthDate}}, {{contact.occupation}}, {{contact.unit}}, {{contact.birthdayWish}}, {{contact.birthdayWishLine1}}...{{contact.birthdayWishLine5}}, {{org.name}}"
                  persistent-hint
                  class="mb-2"
                />
                <div class="d-flex gap-2">
                  <v-text-field v-model.number="htmlWidth" type="number" min="640" max="2000" label="Width" variant="outlined" density="compact" style="max-width: 140px" />
                  <v-text-field v-model.number="htmlHeight" type="number" min="640" max="3000" label="Height" variant="outlined" density="compact" style="max-width: 140px" />
                </div>
                <v-checkbox v-model="htmlFailOpen" label="Lỗi render ảnh vẫn gửi text (failOpen)" density="compact" hide-details class="mt-1" />
              </div>
            </v-expand-transition>
            <div v-if="htmlPreviewEnabled" class="html-template-preview mt-3">
              <div class="html-template-preview__bar">
                <span>Preview mẫu với dữ liệu test</span>
                <span>{{ htmlWidth }} x {{ htmlHeight }}</span>
              </div>
              <div v-if="htmlPreviewSrcdoc" class="html-template-preview__stage">
                <iframe
                  class="html-template-preview__frame"
                  title="HTML template preview"
                  sandbox=""
                  :srcdoc="htmlPreviewSrcdoc"
                />
              </div>
              <div v-else class="html-template-preview__empty">Chưa có SVG để preview</div>
            </div>
          </template>

          <!-- AI image generation: per-send, prepended to outgoing attachments -->
          <v-divider class="my-4" />
          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2" color="purple">mdi-image-auto-adjust</v-icon>
            <span class="text-subtitle-2">AI tạo ảnh tự động</span>
            <v-spacer />
            <v-switch
              v-model="aiImageEnabled"
              color="purple"
              base-color="grey-lighten-1"
              density="compact"
              hide-details
              inset
              class="automation-toggle automation-toggle--purple"
            />
          </div>
          <div class="text-caption text-medium-emphasis mb-2">
            Khi bật, engine sẽ gọi AI gen 1 ảnh mới cho mỗi KH dựa trên prompt bên dưới rồi gửi kèm tin nhắn. Ảnh AI luôn đứng trước các đính kèm tĩnh ở trên.
          </div>
          <template v-if="aiImageEnabled">
            <v-textarea
              v-model="aiImagePrompt.prompt"
              label="Prompt sinh ảnh"
              variant="outlined"
              rows="3"
              auto-grow
              counter="4000"
              :rules="[(v: string) => !!v?.trim() || 'Prompt không được rỗng', (v: string) => (v?.length ?? 0) <= 4000 || 'Tối đa 4000 ký tự']"
              hint="Có thể dùng biến template: {{contact.fullName}}, {{contact.crmName}}, {{org.name}}, {{date.today}}…"
              persistent-hint
              class="mb-3"
            />
            <div class="d-flex gap-2">
              <v-select
                v-model="aiImagePrompt.provider"
                :items="aiProviderItems"
                item-title="label"
                item-value="value"
                label="Provider"
                variant="outlined"
                density="compact"
                style="max-width: 180px"
              />
              <v-text-field
                v-model="aiImagePrompt.model"
                label="Model (optional)"
                variant="outlined"
                density="compact"
                placeholder="theo ENV nếu trống"
              />
              <v-text-field
                v-model="aiImagePrompt.size"
                label="Kích thước"
                variant="outlined"
                density="compact"
                placeholder="1024x1024"
                style="max-width: 140px"
                :rules="[(v: string) => !v || /^\d{2,5}x\d{2,5}$/.test(v) || 'Dạng WxH, vd 1024x1024']"
              />
            </div>
            <v-checkbox
              v-model="aiImagePrompt.failOpen"
              label="Vẫn gửi text nếu gen ảnh lỗi (failOpen)"
              density="compact"
              hide-details
              class="mt-1"
            />
          </template>
        </template>

        <!-- update_status -->
        <template v-else-if="draft.actionType === 'update_status'">
          <v-select
            v-model="statusId"
            :items="statusItems"
            item-title="name"
            item-value="id"
            label="Đổi sang trạng thái"
            variant="outlined"
            density="comfortable"
          />
          <div class="text-caption text-medium-emphasis mt-2">
            Chỉ áp dụng khi KH đang ở 1 trong các trạng thái sau (để trống = áp dụng mọi trạng thái):
          </div>
          <v-select
            v-model="onlyFromStatusIds"
            :items="statusItems"
            item-title="name"
            item-value="id"
            label="Chỉ áp dụng khi đang ở (allowlist)"
            variant="outlined"
            density="comfortable"
            multiple
            chips
            class="mt-2"
          />
        </template>

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">{{ error }}</v-alert>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Huỷ</v-btn>
        <v-btn color="primary" :loading="saving" @click="onSave">{{ isEdit ? 'Lưu' : 'Tạo' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ACTION_TYPE_LABELS, ACTION_TYPE_ICONS, SUPPORTED_ACTION_TYPES, type Block, type BlockActionType, type BlockFolder, type AiImagePrompt } from '@/api/automation/types';
import { blocksApi } from '@/api/automation';

const props = defineProps<{
  modelValue: boolean;
  block?: Block | null;
  folders: BlockFolder[];
  statusItems: Array<{ id: string; name: string }>;
}>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [block: Block];
}>();

const isEdit = computed(() => Boolean(props.block));

interface Draft {
  name: string;
  actionType: BlockActionType;
  folderId: string | null;
}
const draft = ref<Draft>({ name: '', actionType: 'send_message', folderId: null });
const greetingVariants = ref<string[]>(['']);
const textVariants = ref<string[]>(['']);
const attachments = ref<Array<{ kind: string; url: string; caption: string }>>([]);
const htmlImageEnabled = ref(false);
const htmlTemplate = ref('');
const htmlWidth = ref(768);
const htmlHeight = ref(1152);
const htmlFailOpen = ref(true);
const htmlTemplatePreset = ref('');
const htmlPreviewEnabled = ref(false);
const htmlTemplateEditorExpanded = ref(false);
const BIRTHDAY_CARD_BACKGROUND_HREF = '/automation-assets/image/hpbd.png';
const BIRTHDAY_CARD_KDGP_BACKGROUND_HREF = '/automation-assets/image/hpbdkdgp.png';
const BIRTHDAY_VNPT_SVG_TEMPLATE = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="1280" viewBox="0 0 960 1280">
  <defs>
    <style>
      .serif { font-family: 'Times New Roman', Georgia, serif; }
      .script { font-family: 'Brush Script MT', 'Segoe Script', cursive; font-style: italic; }
      .name { fill: #8a5b14; font-size: 64px; }
      .unit { fill: #ffffff; font-size: 30px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
      .dob { fill: #06184a; font-size: 43px; font-weight: 700; letter-spacing: 8px; }
      .message { fill: #0b1f5f; font-size: 25px; font-style: italic; }
    </style>
  </defs>
  <image href="${BIRTHDAY_CARD_BACKGROUND_HREF}" x="0" y="0" width="960" height="1280" preserveAspectRatio="none"/>

  <rect x="145" y="270" width="640" height="99" rx="18" fill="#f6e9de" opacity="0"/>
  <rect x="300" y="380" width="380" height="40" fill="#06184f" opacity="0"/>
  <rect x="420" y="510" width="260" height="45" fill="#f6e9de" opacity="0"/>
  <rect x="286" y="594" width="530" height="150" fill="#f6e9de" opacity="0"/>

  <text x="465" y="326" text-anchor="middle" class="script name">{{contact.salutation}} {{contact.fullName}}</text>
  <text x="487" y="410" text-anchor="middle" class="serif unit">{{contact.unit}}</text>
  <text x="550" y="555" text-anchor="middle" class="serif dob">{{contact.birthDate}}</text>
  <text x="557" y="625" text-anchor="middle" class="serif message">
    <tspan x="557" dy="0">{{contact.birthdayWishLine1}}</tspan>
    <tspan x="557" dy="38">{{contact.birthdayWishLine2}}</tspan>
    <tspan x="557" dy="38">{{contact.birthdayWishLine3}}</tspan>
    <tspan x="557" dy="38">{{contact.birthdayWishLine4}}</tspan>
    <tspan x="557" dy="38">{{contact.birthdayWishLine5}}</tspan>
  </text>
</svg>`;
const BIRTHDAY_VNPT_KDGP_SVG_TEMPLATE = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="1280" viewBox="0 0 960 1280">
  <defs>
    <style>
      .serif { font-family: 'Times New Roman', Georgia, serif; }
      .script { font-family: 'Brush Script MT', 'Segoe Script', cursive; font-style: italic; }
      .name { fill: #0156d0; font-size: 50px; font-weight: 700; letter-spacing: 0.5px; }
      .unit { fill: #f6c86b; font-size: 40px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
      .dob { fill: #06184a; font-size: 46px; font-weight: 700; letter-spacing: 6px; }
      .message { fill: #071d63; font-size: 24px; font-style: italic; }
    </style>
  </defs>
  <image href="${BIRTHDAY_CARD_KDGP_BACKGROUND_HREF}" x="0" y="0" width="960" height="1280" preserveAspectRatio="none"/>

  <rect x="210" y="518" width="540" height="98" rx="18" fill="#06184f" opacity="0"/>
  <rect x="258" y="663" width="444" height="104" rx="18" fill="#f6e9de" opacity="0"/>
  <rect x="270" y="792" width="420" height="175" fill="#ffffff" opacity="0"/>

  <text x="450" y="450" text-anchor="middle" class="script name">{{contact.salutation}} {{contact.fullName}}</text>
  <text x="480" y="550" text-anchor="middle" class="serif unit">{{contact.occupation}}</text>
  <text x="530" y="720" text-anchor="middle" class="serif dob">{{contact.birthDate}}</text>
  <text x="490" y="780" text-anchor="middle" class="serif message">
    <tspan x="490" dy="0">{{contact.birthdayWishLine1}}</tspan>
    <tspan x="490" dy="36">{{contact.birthdayWishLine2}}</tspan>
    <tspan x="490" dy="36">{{contact.birthdayWishLine3}}</tspan>
    <tspan x="490" dy="36">{{contact.birthdayWishLine4}}</tspan>
    <tspan x="490" dy="36">{{contact.birthdayWishLine5}}</tspan>
  </text>
</svg>`;
const HTML_TEMPLATE_PRESETS = [
  {
    value: 'vnpt_birthday_blue_gold',
    label: 'Sinh nhật VNPT Mẫu 1',
    width: 960,
    height: 1280,
    html: BIRTHDAY_VNPT_SVG_TEMPLATE,
  },
  {
    value: 'vnpt_birthday_kdgp_blue_gold',
    label: 'Sinh nhật VNPT Mẫu 2',
    width: 960,
    height: 1280,
    html: BIRTHDAY_VNPT_KDGP_SVG_TEMPLATE,
  },
] as const;
const DEFAULT_HTML_TEMPLATE_PRESET = 'vnpt_birthday_blue_gold';
const htmlTemplatePresetItems = HTML_TEMPLATE_PRESETS.map(({ value, label }) => ({ value, label }));
const htmlPreviewSrcdoc = computed(() => renderTemplatePreview(htmlTemplate.value));
// AI image generation (send_message only) — fully optional. The toggle below
// drives whether `aiImagePrompt` is serialized into block.content on save.
const aiImageEnabled = ref(false);
const aiImagePrompt = ref<Required<Pick<AiImagePrompt, 'prompt'>> & {
  provider: AiImagePrompt['provider'] | '';
  model: string;
  size: string;
  failOpen: boolean;
}>({ prompt: '', provider: '', model: '', size: '1024x1024', failOpen: true });
const aiProviderItems = [
  { value: '', label: 'Mặc định (theo ENV)' },
  { value: 'openai', label: 'OpenAI Images' },
  { value: 'gemini', label: 'Gemini Imagen' },
  { value: 'custom', label: 'Custom endpoint' },
];
const statusId = ref<string>('');
const onlyFromStatusIds = ref<string[]>([]);
const saving = ref(false);
const error = ref<string>('');

const actionTypeItems = SUPPORTED_ACTION_TYPES.map((value) => ({ value, label: ACTION_TYPE_LABELS[value] }));
const folderItems = computed(() => [{ id: null as string | null, name: '— Không folder —' }, ...props.folders.map((f) => ({ id: f.id, name: f.name }))]);

watch(() => props.modelValue, (open) => {
  if (!open) return;
  error.value = '';
  if (props.block) {
    draft.value = {
      name: props.block.name,
      actionType: props.block.actionType,
      folderId: props.block.folderId,
    };
    const c = props.block.content as Record<string, unknown>;
    greetingVariants.value = Array.isArray(c.greetingVariants) ? [...c.greetingVariants as string[]] : [''];
    textVariants.value = Array.isArray(c.textVariants) ? [...c.textVariants as string[]] : [''];
    attachments.value = Array.isArray(c.attachments)
      ? (c.attachments as Array<{ kind: string; url: string; caption?: string }>).map((a) => ({ kind: a.kind, url: a.url, caption: a.caption ?? '' }))
      : [];
    const htmlCfg = c.htmlImageTemplate as { html?: string; width?: number; height?: number; failOpen?: boolean } | undefined;
    if (htmlCfg?.html) {
      htmlImageEnabled.value = true;
      htmlTemplate.value = htmlCfg.html;
      htmlWidth.value = htmlCfg.width ?? 768;
      htmlHeight.value = htmlCfg.height ?? 1152;
      htmlFailOpen.value = htmlCfg.failOpen !== false;
      htmlTemplatePreset.value = findHtmlTemplatePresetValue(htmlCfg.html) ?? '';
      htmlPreviewEnabled.value = false;
      htmlTemplateEditorExpanded.value = false;
    } else {
      htmlImageEnabled.value = false;
      htmlTemplate.value = '';
      htmlWidth.value = 768;
      htmlHeight.value = 1152;
      htmlFailOpen.value = true;
      htmlTemplatePreset.value = '';
      htmlPreviewEnabled.value = false;
      htmlTemplateEditorExpanded.value = false;
    }
    const aiCfg = c.aiImagePrompt as AiImagePrompt | undefined;
    if (aiCfg && typeof aiCfg === 'object' && aiCfg.prompt) {
      aiImageEnabled.value = true;
      aiImagePrompt.value = {
        prompt: aiCfg.prompt,
        provider: aiCfg.provider ?? '',
        model: aiCfg.model ?? '',
        size: aiCfg.size ?? '1024x1024',
        failOpen: aiCfg.failOpen !== false,
      };
    } else {
      aiImageEnabled.value = false;
      aiImagePrompt.value = { prompt: '', provider: '', model: '', size: '1024x1024', failOpen: true };
    }
    statusId.value = typeof c.statusId === 'string' ? c.statusId : '';
    onlyFromStatusIds.value = Array.isArray(c.onlyFromStatusIds) ? [...c.onlyFromStatusIds as string[]] : [];
  } else {
    draft.value = { name: '', actionType: 'send_message', folderId: null };
    greetingVariants.value = [''];
    textVariants.value = [''];
    attachments.value = [];
    htmlImageEnabled.value = true;
    htmlTemplatePreset.value = DEFAULT_HTML_TEMPLATE_PRESET;
    applyHtmlTemplatePreset(DEFAULT_HTML_TEMPLATE_PRESET);
    htmlTemplateEditorExpanded.value = false;
    aiImageEnabled.value = false;
    aiImagePrompt.value = { prompt: '', provider: '', model: '', size: '1024x1024', failOpen: true };
    statusId.value = '';
    onlyFromStatusIds.value = [];
  }
});

watch(htmlTemplatePreset, (value) => {
  if (!value) return;
  applyHtmlTemplatePreset(value);
});

watch([htmlTemplate, htmlWidth, htmlHeight], () => {
  const preset = HTML_TEMPLATE_PRESETS.find((item) => item.value === htmlTemplatePreset.value);
  if (!preset) return;
  const templateMatches = normalizeTemplateSource(htmlTemplate.value) === normalizeTemplateSource(preset.html);
  const sizeMatches = Number(htmlWidth.value) === preset.width && Number(htmlHeight.value) === preset.height;
  if (!templateMatches || !sizeMatches) {
    htmlTemplatePreset.value = '';
  }
});

function applyHtmlTemplatePreset(value: string) {
  const preset = HTML_TEMPLATE_PRESETS.find((item) => item.value === value);
  if (!preset) return;
  htmlTemplate.value = preset.html;
  htmlWidth.value = preset.width;
  htmlHeight.value = preset.height;
  htmlFailOpen.value = true;
  htmlPreviewEnabled.value = true;
  htmlTemplateEditorExpanded.value = false;
}

function findHtmlTemplatePresetValue(html: string) {
  const normalized = normalizeTemplateSource(html);
  return HTML_TEMPLATE_PRESETS.find((item) => normalizeTemplateSource(item.html) === normalized)?.value ?? null;
}

function normalizeTemplateSource(html: string) {
  return html.trim().replace(/\s+/g, ' ');
}

function renderTemplatePreview(template: string) {
  if (!template.trim()) return '';
  const previewGender = 'male';
  const previewSalutation = salutationFromGender(previewGender);
  const previewUnit = 'VNPT CẦN THƠ';
  const replacements: Record<string, string> = {
    'contact.salutation': previewSalutation,
    'contact.fullName': 'Nguyễn Văn A',
    'contact.crmName': `${previewSalutation} Nguyễn Văn A`,
    'contact.birthDate': '01/01/1900',
    'contact.gender': previewGender,
    'contact.occupation': 'N/A',
    'contact.unit': previewUnit,
    'contact.birthdayWish': `Nhân dịp sinh nhật của ${previewSalutation}, kính chúc ${previewSalutation} luôn dồi dào sức khỏe, hạnh phúc, thành công.`,
    'contact.birthdayWishLine1': `Nhân dịp sinh nhật của ${previewSalutation}, kính chúc ${previewSalutation} luôn`,
    'contact.birthdayWishLine2': 'dồi dào sức khỏe, hạnh phúc, thành công và tiếp tục',
    'contact.birthdayWishLine3': `đồng hành cùng với tập thể phát triển vững mạnh,`,
    'contact.birthdayWishLine4': 'hoàn thành xuất sắc mọi nhiệm vụ, đóng góp tích cực',
    'contact.birthdayWishLine5': 'vào sự phát triển chung của VNPT.',
    'org.name': previewUnit,
    'date.today': '01/01/1900',
  };
  const rendered = normalizePreviewAssetUrls(
    template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, key: string) => replacements[key.trim()] ?? ''),
  );
  return `<!doctype html>
<html>
<head>
  <style>
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: #f6f7f9;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
      box-sizing: border-box;
    }
    svg {
      display: block;
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 100%;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
      background: white;
    }
  </style>
</head>
<body>${rendered}</body>
</html>`;
}

function salutationFromGender(gender: string) {
  const value = gender.trim().toLowerCase();
  if (value === 'male' || value === 'nam') return 'Anh';
  if (value === 'female' || value === 'nu' || value === 'nữ') return 'Chị';
  return 'Bạn';
}

function normalizePreviewAssetUrls(markup: string) {
  if (typeof window === 'undefined') return markup;
  return markup.replace(
    /(href|xlink:href)=["']\/automation-assets\//g,
    `$1="${window.location.origin}/automation-assets/`,
  );
}

function updateGreeting(idx: number, val: string) { greetingVariants.value[idx] = val; }
function addGreeting() { greetingVariants.value.push(''); }
function removeGreeting(idx: number) { greetingVariants.value.splice(idx, 1); }

function updateText(idx: number, val: string) { textVariants.value[idx] = val; }
function addText() { textVariants.value.push(''); }
function removeText(idx: number) { textVariants.value.splice(idx, 1); }

function buildContent(): Record<string, unknown> {
  switch (draft.value.actionType) {
    case 'request_friend':
      return { greetingVariants: greetingVariants.value.filter((s) => s.trim()) };
    case 'send_message': {
      const out: Record<string, unknown> = { textVariants: textVariants.value.filter((s) => s.trim()) };
      const valid = attachments.value.filter((a) => a.url.trim());
      if (valid.length > 0) {
        out.attachments = valid.map((a) => ({
          kind: a.kind,
          url: a.url,
          ...(a.caption ? { caption: a.caption } : {}),
        }));
      }
      if (htmlImageEnabled.value && htmlTemplate.value.trim()) {
        out.htmlImageTemplate = {
          html: htmlTemplate.value.trim(),
          width: Math.max(640, Math.min(2000, Number(htmlWidth.value) || 768)),
          height: Math.max(640, Math.min(3000, Number(htmlHeight.value) || 1152)),
          failOpen: htmlFailOpen.value,
        };
      }
      // Only persist aiImagePrompt when the operator explicitly enabled it AND
      // provided a non-empty prompt. Backend validator rejects empty prompts.
      if (aiImageEnabled.value && aiImagePrompt.value.prompt.trim()) {
        const ai: Record<string, unknown> = {
          prompt: aiImagePrompt.value.prompt.trim(),
          failOpen: aiImagePrompt.value.failOpen,
        };
        if (aiImagePrompt.value.provider) ai.provider = aiImagePrompt.value.provider;
        if (aiImagePrompt.value.model.trim()) ai.model = aiImagePrompt.value.model.trim();
        if (aiImagePrompt.value.size.trim()) ai.size = aiImagePrompt.value.size.trim();
        out.aiImagePrompt = ai;
      }
      return out;
    }
    case 'update_status':
      return {
        statusId: statusId.value,
        ...(onlyFromStatusIds.value.length > 0 ? { onlyFromStatusIds: onlyFromStatusIds.value } : {}),
      };
    default:
      return {};
  }
}

async function onSave() {
  error.value = '';
  if (!draft.value.name.trim()) { error.value = 'Tên block không được rỗng'; return; }
  saving.value = true;
  try {
    const content = buildContent();
    let block: Block;
    if (props.block) {
      block = await blocksApi.updateBlock(props.block.id, {
        name: draft.value.name.trim(),
        folderId: draft.value.folderId,
        content,
      });
    } else {
      block = await blocksApi.createBlock({
        name: draft.value.name.trim(),
        actionType: draft.value.actionType,
        folderId: draft.value.folderId,
        content,
      });
    }
    emit('saved', block);
    emit('update:modelValue', false);
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Lỗi không xác định';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.automation-toggle {
  flex: 0 0 auto;
}

.automation-toggle :deep(.v-switch__track) {
  opacity: 1 !important;
}

.automation-toggle:not(.v-selection-control--dirty) :deep(.v-switch__track) {
  background-color: #e5e7eb !important;
  border: 1px solid #cbd5e1;
}

.automation-toggle:not(.v-selection-control--dirty) :deep(.v-switch__thumb) {
  background-color: #ffffff !important;
  color: #64748b !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
}

.automation-toggle.v-selection-control--dirty :deep(.v-switch__track),
.automation-toggle :deep(.v-selection-control--dirty .v-switch__track) {
  opacity: 1 !important;
  border-color: transparent;
}

.automation-toggle.v-selection-control--dirty :deep(.v-switch__thumb),
.automation-toggle :deep(.v-selection-control--dirty .v-switch__thumb) {
  background-color: #ffffff !important;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.24);
}

.automation-toggle--indigo.v-selection-control--dirty :deep(.v-switch__track),
.automation-toggle--indigo :deep(.v-selection-control--dirty .v-switch__track) {
  background-color: #4f46e5 !important;
}

.automation-toggle--blue.v-selection-control--dirty :deep(.v-switch__track),
.automation-toggle--blue :deep(.v-selection-control--dirty .v-switch__track) {
  background-color: #2563eb !important;
}

.automation-toggle--teal.v-selection-control--dirty :deep(.v-switch__track),
.automation-toggle--teal :deep(.v-selection-control--dirty .v-switch__track) {
  background-color: #0f766e !important;
}

.automation-toggle--purple.v-selection-control--dirty :deep(.v-switch__track),
.automation-toggle--purple :deep(.v-selection-control--dirty .v-switch__track) {
  background-color: #7e22ce !important;
}

.send-target-row {
  display: grid;
  grid-template-columns: minmax(200px, 240px) minmax(260px, 1fr) 36px;
  align-items: start;
  gap: 12px;
}

.send-target-row__account,
.send-target-row__recipient {
  min-width: 0;
}

.send-target-row__remove {
  margin-top: 2px;
  justify-self: end;
}

.html-template-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.html-template-controls__select {
  flex: 1 1 320px;
  min-width: 220px;
}

.html-template-controls__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex: 0 0 auto;
}

.html-template-editor-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 12px;
}

.html-template-preview {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.html-template-preview__bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.html-template-preview__stage {
  width: 100%;
  height: min(58vh, 430px);
  min-height: 300px;
  padding: 10px;
  background: #f6f7f9;
  box-sizing: border-box;
}

.html-template-preview__frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
}

.html-template-preview__empty {
  padding: 32px 12px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  text-align: center;
  font-size: 13px;
}

@media (max-width: 720px) {
  .send-target-row {
    grid-template-columns: 1fr 36px;
    gap: 8px;
  }

  .send-target-row__account,
  .send-target-row__recipient {
    grid-column: 1 / 2;
  }

  .send-target-row__remove {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }

  .html-template-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .html-template-controls__select {
    flex-basis: auto;
    min-width: 0;
  }

  .html-template-controls__actions {
    justify-content: flex-start;
  }
}
</style>
