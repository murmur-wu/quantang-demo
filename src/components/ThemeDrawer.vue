<script setup lang="ts">
import LocaleSwitcher from './LocaleSwitcher.vue'
// 主題設定抽屜:設定即時套用並自動儲存到後端(每位使用者各自一份)
import { useThemeStore, type ThemeSettings } from '../stores/theme'
import { strings } from '../strings'
import Switch from './Switch.vue'

defineProps<{ show: boolean }>()
const emit = defineEmits<{ close: [] }>()

const theme = useThemeStore()

const modes = [
  { value: 'light', icon: '☀️', label: 'app.light' },
  { value: 'dark', icon: '🌙', label: 'app.dark' },
  { value: 'auto', icon: 'Ⓐ', label: 'app.auto' },
] as const

const colorFields: { key: keyof ThemeSettings; label: string }[] = [
  { key: 'success', label: 'app.success' },
  { key: 'warning', label: 'app.warning' },
  { key: 'danger', label: 'app.danger' },
]

function setNum(key: 'radius' | 'sidebarWidth' | 'footerHeight', delta: number, min: number, max: number) {
  const next = Math.min(max, Math.max(min, theme.s[key] + delta))
  theme.set({ [key]: next })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>
      <aside class="absolute right-0 top-0 flex h-full w-[330px] flex-col bg-card shadow-2xl">
        <div class="flex items-center justify-between border-b border-line px-5 py-4">
          <h4 class="text-[15px] font-semibold">{{ strings.themeSettings }}</h4>
          <button class="text-disabled hover:text-secondary" @click="emit('close')">✕</button>
        </div>

        <div class="flex-1 space-y-6 overflow-y-auto px-5 py-5 text-[13px]">
          <div class="flex items-center justify-between"><span>{{ $t('common.language') }}</span><LocaleSwitcher /></div>
          <!-- 主題模式 -->
          <section>
            <div class="mb-3 flex items-center gap-3 text-secondary">
              <span class="h-px flex-1 bg-line"></span>{{ $t('app.themeMode') }}<span class="h-px flex-1 bg-line"></span>
            </div>
            <div class="mx-auto flex w-fit rounded bg-muted p-1">
              <button
                v-for="m in modes"
                :key="m.value"
                :title="$t(m.label)"
                class="rounded px-4 py-1.5"
                :class="theme.s.mode === m.value ? 'bg-card shadow' : 'text-disabled'"
                @click="theme.set({ mode: m.value })"
              >{{ m.icon }}</button>
            </div>
            <div class="mt-4 space-y-3">
              <div class="flex items-center justify-between">
                <span>{{ $t('app.darkSidebar') }}</span>
                <Switch :on="theme.s.darkSidebar" @toggle="theme.set({ darkSidebar: !theme.s.darkSidebar })" />
              </div>
              <div class="flex items-center justify-between">
                <span>{{ $t('app.gray') }}</span>
                <Switch :on="theme.s.gray" @toggle="theme.set({ gray: !theme.s.gray })" />
              </div>
              <div class="flex items-center justify-between">
                <span>{{ $t('app.weak') }}</span>
                <Switch :on="theme.s.weak" @toggle="theme.set({ weak: !theme.s.weak })" />
              </div>
            </div>
          </section>

          <!-- 主題顏色 -->
          <section>
            <div class="mb-3 flex items-center gap-3 text-secondary">
              <span class="h-px flex-1 bg-line"></span>{{ $t('app.themeColors') }}<span class="h-px flex-1 bg-line"></span>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span>{{ $t('app.primary') }}</span>
                <label class="relative cursor-pointer rounded px-2.5 py-1 font-mono text-xs text-white" :style="{ background: theme.s.primary }">
                  {{ theme.s.primary }}
                  <input type="color" class="absolute inset-0 cursor-pointer opacity-0" :value="theme.s.primary" @input="theme.set({ primary: ($event.target as HTMLInputElement).value })" />
                </label>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  {{ strings.infoColor }}
                  <label class="flex items-center gap-1 text-secondary">
                    <input type="checkbox" class="accent-primary" :checked="theme.s.infoFollow" @change="theme.set({ infoFollow: ($event.target as HTMLInputElement).checked })" /> {{ $t('app.followPrimary') }}
                  </label>
                </span>
                <label class="relative rounded px-2.5 py-1 font-mono text-xs text-white" :class="theme.s.infoFollow ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'" :style="{ background: theme.s.infoFollow ? theme.s.primary : theme.s.info }">
                  {{ theme.s.infoFollow ? theme.s.primary : theme.s.info }}
                  <input v-if="!theme.s.infoFollow" type="color" class="absolute inset-0 cursor-pointer opacity-0" :value="theme.s.info" @input="theme.set({ info: ($event.target as HTMLInputElement).value })" />
                </label>
              </div>
              <div v-for="f in colorFields" :key="f.key" class="flex items-center justify-between">
                <span>{{ $t(f.label) }}</span>
                <label class="relative cursor-pointer rounded px-2.5 py-1 font-mono text-xs text-white" :style="{ background: theme.s[f.key] as string }">
                  {{ theme.s[f.key] }}
                  <input type="color" class="absolute inset-0 cursor-pointer opacity-0" :value="theme.s[f.key] as string" @input="theme.set({ [f.key]: ($event.target as HTMLInputElement).value } as any)" />
                </label>
              </div>
            </div>
          </section>

          <!-- 主題圓角 -->
          <section>
            <div class="mb-3 flex items-center gap-3 text-secondary">
              <span class="h-px flex-1 bg-line"></span>{{ $t('app.themeRadius') }}<span class="h-px flex-1 bg-line"></span>
            </div>
            <div class="flex items-center justify-between">
              <span>{{ $t('app.radius') }}</span>
              <div class="flex items-center rounded border border-line">
                <span class="w-12 text-center">{{ theme.s.radius }}</span>
                <button class="border-l border-line px-2.5 py-1 text-secondary hover:text-primary" @click="setNum('radius', -1, 0, 16)">−</button>
                <button class="border-l border-line px-2.5 py-1 text-secondary hover:text-primary" @click="setNum('radius', 1, 0, 16)">＋</button>
              </div>
            </div>
          </section>

          <!-- 佈局設定 -->
          <section>
            <div class="mb-3 flex items-center gap-3 text-secondary">
              <span class="h-px flex-1 bg-line"></span>{{ strings.layoutSettings }}<span class="h-px flex-1 bg-line"></span>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span>{{ $t('app.sidebarWidth') }}</span>
                <div class="flex items-center rounded border border-line">
                  <span class="w-12 text-center">{{ theme.s.sidebarWidth }}</span>
                  <button class="border-l border-line px-2.5 py-1 text-secondary hover:text-primary" @click="setNum('sidebarWidth', -10, 160, 320)">−</button>
                  <button class="border-l border-line px-2.5 py-1 text-secondary hover:text-primary" @click="setNum('sidebarWidth', 10, 160, 320)">＋</button>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span>{{ $t('app.showFooter') }}</span>
                <Switch :on="theme.s.showFooter" @toggle="theme.set({ showFooter: !theme.s.showFooter })" />
              </div>
              <div v-if="theme.s.showFooter" class="flex items-center justify-between">
                <span>{{ $t('app.footerHeight') }}</span>
                <div class="flex items-center rounded border border-line">
                  <span class="w-12 text-center">{{ theme.s.footerHeight }}</span>
                  <button class="border-l border-line px-2.5 py-1 text-secondary hover:text-primary" @click="setNum('footerHeight', -4, 32, 96)">−</button>
                  <button class="border-l border-line px-2.5 py-1 text-secondary hover:text-primary" @click="setNum('footerHeight', 4, 32, 96)">＋</button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="border-t border-line p-4">
          <button class="w-full rounded border border-line py-2 text-secondary hover:border-danger hover:text-danger" @click="theme.reset()">{{ $t('app.resetTheme') }}</button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
