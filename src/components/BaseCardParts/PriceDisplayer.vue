<script setup lang="ts">

defineProps({
  label: {
    type: String,
    default: ''
  },
  currencySymbol: {
    type: String,
  },
  amount: {
    type: Number,
  }
})
</script>

<template>
  <span class="text-sm font-bold pr-1" v-if="label">{{ label }}:</span>
  <template v-if="amount">
    <span>{{ amount }}</span>
    {{ currencySymbol }}
  </template>
  <span v-else class="text-sm border-1 text-gray-300">N/A</span>
</template>