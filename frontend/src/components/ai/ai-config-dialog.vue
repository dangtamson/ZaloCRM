<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>Cấu hình AI</v-card-title>
      <v-card-text>
        <v-progress-linear v-if="loadingProviders" indeterminate class="mb-4" />
        <v-select v-model="local.provider" :items="providerItems" label="Provider" class="mb-3" :disabled="loadingProviders" @update:model-value="onProviderChange" />
        <v-combobox
          v-model="local.model"
          :items="modelOptions"
          item-title="title"
          item-value="value"
          label="Model"
          class="mb-3"
          :disabled="loadingProviders"
          hint="Có thể chọn model có sẵn hoặc nhập model tuỳ chỉnh."
          persistent-hint
        />
        <v-text-field
          v-model="local.baseUrl"
          label="Base URL"
          class="mb-3"
          :placeholder="selectedProvider?.baseUrl || 'https://api.example.com/v1'"
          hint="Dùng cho OpenAPI-compatible/Ollama hoặc override endpoint mặc định."
          persistent-hint
        />
        <v-text-field
          v-if="selectedProvider?.authRequired !== false"
          v-model="local.apiKey"
          type="password"
          label="API key"
          class="mb-3"
          :placeholder="config.providerApiKeyConfigured ? 'Đã cấu hình, để trống nếu không đổi' : ''"
          :hint="config.providerApiKeyConfigured ? 'Để trống để giữ API key hiện tại.' : 'Nhập API key cho provider này nếu chưa cấu hình bằng ENV.'"
          persistent-hint
        />
        <v-text-field v-model.number="local.maxDaily" type="number" label="Quota mỗi ngày" :min="1" :rules="[v => v >= 1 || 'Tối thiểu 1']" class="mb-3" />
        <v-switch v-model="local.enabled" label="Bật AI" inset color="primary" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Đóng</v-btn>
        <v-btn color="primary" :loading="loading" @click="emitSave">Lưu</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { api } from '@/api';

type ProviderModel = { title: string; value: string };
type ProviderInfo = { id: string; name: string; baseUrl?: string; authRequired?: boolean; models: ProviderModel[] };

const props = defineProps<{
  modelValue: boolean;
  loading: boolean;
  config: { provider: string; model: string; maxDaily: number; enabled: boolean; providerBaseUrl?: string; providerApiKeyConfigured?: boolean };
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [value: { provider: string; model: string; maxDaily: number; enabled: boolean; apiKey?: string; baseUrl?: string }];
}>();

const providers = ref<ProviderInfo[]>([]);
const loadingProviders = ref(false);

/* Dropdown items derived from API data */
const providerItems = computed(() => providers.value.map((p) => ({ title: p.name, value: p.id })));
const modelOptions = computed(() => {
  const found = providers.value.find((p) => p.id === local.provider);
  return found?.models ?? [];
});
const selectedProvider = computed(() => providers.value.find((p) => p.id === local.provider));

const local = reactive({ provider: 'gemini', model: '', maxDaily: 500, enabled: true, apiKey: '', baseUrl: '' });

/* When provider changes, auto-select first model if current is invalid */
function onProviderChange() {
  const valid = modelOptions.value.some((m) => m.value === local.model);
  if (!valid) local.model = modelOptions.value[0]?.value ?? '';
  local.baseUrl = selectedProvider.value?.baseUrl ?? '';
  local.apiKey = '';
}

function emitSave() {
  emit('save', {
    provider: local.provider,
    model: typeof local.model === 'string' ? local.model : String(local.model || ''),
    maxDaily: local.maxDaily,
    enabled: local.enabled,
    baseUrl: local.baseUrl.trim(),
    ...(local.apiKey.trim() ? { apiKey: local.apiKey.trim() } : {}),
  });
}

/* Fetch available providers from backend */
async function fetchProviders() {
  loadingProviders.value = true;
  try {
    const res = await api.get('/ai/providers');
    providers.value = res.data;
  } catch {
    providers.value = [];
  } finally {
    loadingProviders.value = false;
  }
}

/* Fetch providers when dialog opens */
watch(() => props.modelValue, (open) => {
  if (open) fetchProviders();
});

/* Sync config prop → local state */
watch(() => props.config, (value) => {
  local.provider = value.provider;
  local.model = value.model;
  local.maxDaily = value.maxDaily;
  local.enabled = value.enabled;
  local.baseUrl = value.providerBaseUrl ?? '';
  local.apiKey = '';
}, { immediate: true, deep: true });
</script>
