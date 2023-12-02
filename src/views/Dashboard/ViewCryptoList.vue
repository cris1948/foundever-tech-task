<script lang="ts" setup>
import { computed, DefineComponent, inject, Ref, ref, watch, } from "vue";
import {
  BaseDynamicList,
  BaseDynamicSorts,
  BaseInputFilter,
  BaseLoader,
  BaseSelectFilter,
  BaseTitle,
} from "@/app.organizer";
import { useI18n } from "vue-i18n";
import { TCryptoData } from "@/types/crypto.types";
import { IAppProvider } from "@/providers/app";
import { useRoute } from "vue-router";
import { useCrypto } from "@/composables/useCrypto";

type TEventLists = {
  newList: TCryptoData[];
  oldList: TCryptoData[];
};

const App = inject<IAppProvider>("App");

const props = defineProps<{
  title: string;
  items: Map<string, TCryptoData>;
  component: DefineComponent<any, any, any>;
}>();

const { t: print } = useI18n();

const {
  currencyActive,
  currenciesList,
  isReadyCategories,
  isReadyCurrencies,
  isReadyCryptoList,
  itemsByPage,
  fetchCryptosInfos,
  setCurrencyActive
} = useCrypto();

const isReadyCryptoStore = computed(
    () => isReadyCategories.value && isReadyCurrencies.value && isReadyCryptoList.value
);

const dynamicController = ref() as Ref<typeof BaseDynamicList>;
const refInputFilter = ref() as Ref<typeof BaseInputFilter>;

const updatePricesForList = async ({ newList, oldList }: TEventLists) => {
  const oldListIds = oldList.map(o => o.id);
  const toUpdatePricesList = newList.filter((n) => {
    if (!n.pricesByCurrencies[currencyActive.value]) return true;
    return !oldListIds.includes(n.id)
  });
  await fetchCryptosInfos(toUpdatePricesList);
};

const currenciesListOptions = computed(() => {
  return currenciesList.value.map((c) => {
    return {
      value: c,
      label: c,
    };
  });
});

const route = useRoute();
watch(
    () => route.name,
    () => {
      if (refInputFilter) refInputFilter.value.reset();
      if (dynamicController) dynamicController.value.onReset();
    }
);
</script>

<template>
  <div v-if="!isReadyCryptoStore" class="flex flex-1 relative">
    <BaseLoader :text="print('loading_data')"/>
  </div>
  <div
      v-else
      class="flex flex-1 flex-col pt-16 w-full lg:w-5/6 max-w-screen-xl self-center"
  >
    <div class="flex flex-col max-w-screen w-full bg-blue mx-auto">
      <div class="flex grid grid-cols-1 md:grid-cols-5">
        <div class="flex col-span-2 justify-center md:justify-start">
          <BaseTitle :text="title" class="-mt-3 mr-4 a-05 fadeInLeft"/>
        </div>
        <div class="flex col-span-3 items-center justify-center md:justify-start mb-2 md:mb-0">
          <BaseInputFilter
              ref="refInputFilter"
              :controller="dynamicController"
              :placeholder="print('search_a_name') + '...'"
              :search-indexes="['name', 'symbol']"
              class="rounded-l-full h-10 shadow p-2 outline-0 a-05 d-500 fadeInDown"
              index="name"
          />
          <BaseSelectFilter
              :default="currencyActive"
              :options="currenciesListOptions"
              class="rounded-r-full h-10 shadow uppercase font-bold pl-3 a-08 d-500 fadeInDown"
              index="currency"
              @onChange="setCurrencyActive"
          />
        </div>
      </div>
      <div class="flex flex-1 mt-1">
        <BaseDynamicSorts
            :controller="dynamicController"
            class="h-10 pb-1 rounded-r-full shadow a-05 d-200 fadeInDown"
        />
      </div>
    </div>

    <div class="db-list flex-1 flex flex-col p-1">
      <BaseDynamicList
          ref="dynamicController"
          :component="props.component"
          :items="props.items"
          :items-by-bloc="itemsByPage"
          :loader-color="App?.theme.value === 'dark' ? 'white' : 'black'"
          :no-result-text="print('no_result')"
          :watcher="currencyActive"
          class="d-400 a-04 fadeInUp"
          component-key="id"
          @onRequestNextBloc="(data) => updatePricesForList(data as TEventLists)"
      />
    </div>
  </div>
</template>

<style lang="scss"></style>
