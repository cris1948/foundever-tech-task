<script setup lang="ts">
import {computed, PropType, ref} from "vue";
import {storeToRefs} from "pinia";
import {TCryptoData} from "@/stores/crypto.types";
import {useCryptoStore} from "@/stores/crypto";
import {
  BaseCryptoChart,
  BaseSelectFilter,
  FavoriteStar,
  Spinner,
} from "@/app.organizer";
import useCurrencySymbol from "@/composables/useCurrencySymbol";
import {useI18n} from "vue-i18n";
import PriceDisplayer from "@/components/BaseCardParts/PriceDisplayer.vue";


const props = defineProps({
  item: {
    type: Object as PropType<TCryptoData>,
    required: true
  }
});

const cryptoStore = useCryptoStore();

const {currencyActive, currenciesList} =
    storeToRefs(cryptoStore);

const { setCurrencyActive } = cryptoStore;

const currencySymbol = computed(() => useCurrencySymbol(currencyActive.value));
const chartElement = ref();

const {t: print} = useI18n();

const currenciesListOptions = computed(() => {
  return currenciesList.value.map((c) => {
    return {
      value: c,
      label: c,
    };
  });
});
</script>

<template>
  <div v-if="item" class="relative mt-20 lg:mt-20 rounded w-full lg:w-5/6 max-w-screen-xl  align-self mx-auto">
    <div class="flex grid grid-cols-1 lg:grid-cols-10 w-full">
      <div class="image flex col-span-2 pl-2 pr-2 items-center a-1 justify-center fadeInLeft">
        <img
            v-if="item.image"
            v-lazy="item.image"
            class="w-150 h-150 border-round rounded-full"
        />
        <Spinner
            v-else
            color="#DDD"
            size="small"
            class="inline-block mx-auto"
        />
      </div>
      <div
          class="col-span-8 grid grid-cols-1 lg:grid-cols-10 items-center gradient mt-4 lg:mt-0 a-05 fadeInDown rounded-r"
      >
        <!--         TODO - inline styles-->
        <div
            class="flex col-span-10 lg:col-span-2 justify-center lg:justify-start items-center lg:p-2 lg:pr-4 font-bold text-5xl stroke-black a-1 d-600 fadeIn"
            style="text-stroke: 2px white;"
        >
          {{
            item.name.length > 35
                ? item.name.slice(0, 35) + "..."
                : item.name
          }}
        </div>
        <div
            class="flex col-span-10 lg:col-span-1 pl-4 pr-4 items-center justify-center lg:justify-start text-gray-400">
          [{{ item.symbol }}]
        </div>
        <div class="flex flex-col col-span-10 lg:col-span-3 justify-center lg:justify-start  pl-4 pr-4 text-black">
          <div class="inline text-center lg:text-left">
            <PriceDisplayer
                :label="print('current_price')"
                :amount="item.pricesByCurrencies[currencyActive]?.current_price || 0"
                :currency-symbol="currencySymbol"
            />
          </div>
          <div class="inline text-center lg:text-left">
            <PriceDisplayer
                :label="print('market_cap')"
                :amount="item.pricesByCurrencies[currencyActive]?.market_cap || 0"
                :currency-symbol="currencySymbol"
            />
          </div>
          <div class="inline text-center lg:text-left">
            <PriceDisplayer
                :label="print('total_volume')"
                :amount="item.pricesByCurrencies[currencyActive]?.total_volume || 0"
                :currency-symbol="currencySymbol"
            />
          </div>
        </div>
        <div class="flex items-center justify-center lg:justify-start">
          <BaseSelectFilter
              index="currency"
              :default="currencyActive"
              :options="currenciesListOptions"
              @onChange="setCurrencyActive"
              class="lg:rounded-r-full rounded-full h-10 mt-2 mb-2 lg:mt-0 lg:mb-0 shadow uppercase font-bold pl-3 a-08 d-500 fadeInDown"
          />
        </div>
        <div
            class="flex col-span-10 lg:col-span-2 items-center justify-center lg:justify-end pb-4 lg:pr-3 lg:pr-10"
        >
          <div class="flex items-center">
            <FavoriteStar :itemId="item.id" :activeLabel="print('favorite')" :label="print('add_to_favorites')"
                          class="pr"/>
          </div>
        </div>
      </div>
    </div>
    <div
        class="flex flex-1 w-200 items-center text-black dark:text-white lg:pr-3 mt-10"
        ref="chartElement"
    >
      <template v-if="item.calculatedSparkline">
        <BaseCryptoChart
            :sparkline="item.calculatedSparkline"
            :labels="item.orderedSparkLabels"
            :animation="true"
            :tooltip="true"
            :win="
            item.calculatedSparkline[0] <
            item.calculatedSparkline[item.calculatedSparkline.length - 1]
          "
        />
      </template>
      <div
          v-else
          class="flex flex-1 min-h-48 justify-center items-center text-sm border-1 text-gray-300 text-2xl d-2 a-1 fadeIn"
      >
        {{ print("no_graphic_found") }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.image {
  min-width: 50px;
}

.gradient {
  background: rgb(2, 0, 36);
  background: linear-gradient(
          90deg,
          rgba(2, 0, 36, 0) 6%,
          rgba(255, 255, 255, 1) 17%,
          rgba(255, 255, 255, 1) 100%
  );
}
</style>
