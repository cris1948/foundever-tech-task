<script lang="ts" setup>
import { computed, PropType, ref } from "vue";
import { TCryptoData } from "@/types/crypto.types";
import { BaseCryptoChart, FavoriteStar, Spinner } from "@/app.organizer";
import { useIntersectionObserver } from "@vueuse/core";
import useCurrencySymbol from "@/composables/useCurrencySymbol";

import { ROUTE_CRYPTO_VIEW } from "@/app.routes";
import PriceDisplayer from "@/components/BaseCardParts/PriceDisplayer.vue";
import { useCrypto } from "@/composables/useCrypto";

const props = defineProps({
  item: {
    type: Object as PropType<TCryptoData>,
    required: true
  }
});

const { currencyActive } = useCrypto();
const currencySymbol = computed(() => useCurrencySymbol(currencyActive.value));

const chartElement = ref();
const chartIsVisible = ref(true);

useIntersectionObserver(chartElement, ([ { isIntersecting } ]) => {
  chartIsVisible.value = isIntersecting;
});
</script>

<template>
  <div
      class="line-crypto w-100 block flex flex-1 h-16 mb-1 cursor-pointer"
      @click="
      () =>
        $router.push({
          name: ROUTE_CRYPTO_VIEW.name,
          params: { id: item.id },
        })
    "
  >
    <div class="flex w-20 pl-2 pr-2 items-center">
      <img
          alt="crypto logo"
          v-if="item.image"
          v-lazy="item.image"
          class="w-8 h-8 border-round rounded-full"
      />
      <Spinner v-else class="inline-block mx-auto" color="#DDD" size="small"/>
    </div>
    <div
        class="flex w-48 pl-4 pr-4 items-center text-black dark:text-white p-2 font-bold"
    >
      {{
        item.name.length > 20 ? item.name.slice(0, 20) + "..." : item.name
      }}
    </div>
    <div class="flex pl-4 pr-4 w-44 items-center text-black dark:text-white">
      <PriceDisplayer
          :amount="item.pricesByCurrencies[currencyActive]?.currentPrice || 0"
          :currency-symbol="currencySymbol"
      />
    </div>
    <div class="flex pl-4 pr-4 w-36 items-center text-black dark:text-white">
      <PriceDisplayer
          :amount="item.pricesByCurrencies[currencyActive]?.marketCap || 0"
          :currency-symbol="currencySymbol"
      />
    </div>
    <div class="flex pl-4 pr-4 w-40 items-center text-black dark:text-white">
      <PriceDisplayer
          :amount="item.pricesByCurrencies[currencyActive]?.totalVolume || 0"
          :currency-symbol="currencySymbol"
      />
    </div>
    <div
        ref="chartElement"
        class="flex flex-1 w-200 items-center text-black dark:text-white pr-3"
    >
      <template v-if="item.calculatedSparkline && chartIsVisible">
        <BaseCryptoChart
            :grid="false"
            :labels="item.orderedSparkLabels"
            :sparkline="item.calculatedSparkline"
            :tooltip="false"

            :win="
            item.calculatedSparkline[0] <
            item.calculatedSparkline[item.calculatedSparkline.length - 1]
          "
        />
      </template>
      <div v-else class="text-sm border-1 text-gray-300">N/A</div>
    </div>
    <div
        class="flex w-14 items-center justify-center pr-3 cursor-pointer"
    >
      <FavoriteStar :itemId="item.id"/>
    </div>
  </div>
</template>

<style lang="scss">
.line-crypto {
  transition: all 0.2s;
}

#app.dark {
  .line-crypto:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }
}

#app.light {
  .line-crypto:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
}
</style>
