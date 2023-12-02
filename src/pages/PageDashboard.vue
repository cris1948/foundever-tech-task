<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useMeta } from "vue-meta";
import { useI18n } from "vue-i18n";
import { BaseLineCrypto, LayoutDashboard, ViewCryptoList } from "../app.organizer";
import { ROUTE_CRYPTO_FAVORITES, ROUTE_CRYPTO_OVERVIEW } from "../app.routes";
import { useCrypto } from "@/composables/useCrypto";

useMeta({
  title: "Cryptoleet",
  description: "Dashboard",
});

const router = useRouter();
const routeIsHome = computed(
    () => router.currentRoute.value.name === ROUTE_CRYPTO_OVERVIEW.name
);
const routeIsFavorites = computed(
    () => router.currentRoute.value.name === ROUTE_CRYPTO_FAVORITES.name
);

const { t: print } = useI18n();

const {
  cryptoList,
  cryptoFavorites,
} = useCrypto();

const viewProps = computed(() => {
  return {
    title: routeIsHome.value ? print('cryptocurrency_prices') : print('cryptocurrency_favorites'),
    items: routeIsHome.value ? cryptoList.value : cryptoFavorites.value,
    component: BaseLineCrypto
  }
})

</script>

<template>
  <LayoutDashboard>
    <ViewCryptoList
        v-if="routeIsHome || routeIsFavorites"
        v-bind="viewProps"
    />
    <router-view v-else/>
  </LayoutDashboard>
</template>

<style lang="scss"></style>
