<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { BaseCardCrypto, BaseLoader } from "@/app.organizer";
import { useI18n } from "vue-i18n";
import { TCryptoData } from "@/types/crypto.types";
import { useRouter } from "vue-router";
import { ROUTE_CRYPTO_OVERVIEW } from "@/app.routes";
import { useCrypto } from "@/composables/useCrypto";

const router = useRouter();

const id = router.currentRoute.value.params.id as string;

const item = ref<TCryptoData>()

const cryptoStore = useCrypto();

const {
  currencyActive,
  cryptoList,
  isReadyCategories,
  isReadyCurrencies,
  isReadyCryptoList,
  fetchCryptosInfos
} = cryptoStore;

const isReadyCryptoStore = computed(
    () => isReadyCategories.value && isReadyCurrencies.value && isReadyCryptoList.value
);

const { t: print } = useI18n();

watch(isReadyCryptoStore, (newState) => {
  if (newState && id && registerItem()) fetchItemInfos();
});

watch(currencyActive, (newCrypto) => {
  fetchItemInfos()
})


const registerItem = () => {
  const storeItem = cryptoList.value.get(id as string);
  if (storeItem) {
    item.value = storeItem;
    return true
  } else {
    router.push({ name: ROUTE_CRYPTO_OVERVIEW.name })
    return false;
  }
}
const fetchItemInfos = () => {
  if (item.value) {
    fetchCryptosInfos([ item.value ])
  }
}

onMounted(() => {
  if (isReadyCryptoStore.value) {
    registerItem()
    fetchItemInfos();
  }
})

</script>

<template>
  <div v-if="!isReadyCryptoStore || !item" class="flex flex-1 relative">
    <BaseLoader :text="print('loading_data')"/>
    {{ isReadyCryptoStore ? 'true' : 'false' }}
  </div>
  <div v-else-if="isReadyCryptoStore && item" class="flex flex-1 relative">
    <BaseCardCrypto :item="item"/>
  </div>
</template>

<style lang="scss"></style>
