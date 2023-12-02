<script lang="ts" setup>
import { IAppProvider } from "@/providers/app";
import { computed, inject } from "vue";
import { useCrypto } from "@/composables/useCrypto";

const props = defineProps<{ itemId: string; activeLabel?: string; label?: string }>();

const App = inject<IAppProvider>("App");
const { isInFavorites, toggleFavorite } = useCrypto();

const active = computed(() => {
  return isInFavorites.value(props.itemId)
})

const getImageSource = computed(() => {
  try {
    let file = "ico-star-";
    if (active.value) file += "full";
    if (!active.value) {
      file +=
          App?.theme.value === "dark" ? "empty-dark" : "empty-light";
    }
    return new URL(`../assets/img/${ file }.png`, import.meta.url).href;
  } catch (e) {
    console.warn(e);
  }
});
</script>

<template>
  <div @click.prevent.stop="toggleFavorite(props.itemId)">
    <img :src="getImageSource" class="w-6 h-6 inline-block cursor-pointer"/>
    <span
        v-if="activeLabel && label"
        :class="[(active ? 'text-gray-400 capitalize' : 'hover:underline')]"
        class="pl-1 text-xs cursor-pointer"
    >
      {{ active ? props.activeLabel : props.label }}
    </span>
  </div>
</template>
