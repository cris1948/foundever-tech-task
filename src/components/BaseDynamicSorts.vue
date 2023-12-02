<script lang="ts" setup>
import type { BaseDynamicList } from "@/app.organizer";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { sorterCharacters, sorterPrices, sorterSparkline7days } from "@/utils/sorters";
import { useCrypto } from "@/composables/useCrypto";

export type TDynamicSort = {
  index: string;
  order: "asc" | "desc";
  sorter: (a: any, b: any) => number;
};

const props = defineProps<{
  controller: typeof BaseDynamicList;
}>();

const { t: print } = useI18n();

const { currencyActive } = useCrypto();

const lastSorter = ref<TDynamicSort>({
  index: "name",
  order: "asc",
  sorter: sorterCharacters("name"),
});

const updateSorter = (sortName: string) => {
  let sorter: Function | null;
  let alreadyActiveSorter: boolean = lastSorter.value.index === sortName;
  let order: "asc" | "desc" =
      alreadyActiveSorter && lastSorter.value.order === "asc" ? "desc" : "asc";
  if ([ "name" ].includes(sortName)) sorter = sorterCharacters(sortName);
  else if ([ "marketCap", "currentPrice", "totalVolume" ].includes(sortName))
    sorter = sorterPrices(currencyActive.value, sortName);
  else if ([ "sparklineIn7d" ].includes(sortName)) sorter = sorterSparkline7days(currencyActive.value, sortName)
  else sorter = null;

  if (sorter) {
    lastSorter.value = {
      index: sortName,
      order: order,
      sorter: sorter as (a: any, b: any) => number,
    }
    updateController(lastSorter.value);
  }
};


const updateController = (sort: TDynamicSort) => {
  try {
    if (props.controller) {
      props.controller.onUpdateSorters(sort);
    }
  } catch (e) {
    console.warn(e);
  }
};

onMounted(() => {
  updateSorter('name');
})

</script>

<template>
  <div class="dyn-order max-w-max flex flex-1" style="max-width: 100%">
    <div class="block flex w-20 pl-2 pr-2 items-center"/>
    <div
        class="flex w-48 pl-4 pr-4 items-center align-center text-gray-600 dark:text-white font-bold cursor-pointer"
        @click="updateSorter('name')"
    >
      {{ print("name") }}
    </div>
    <div
        class="flex pl-4 pr-4 w-36 items-center align-center text-gray-600 dark:text-white font-bold cursor-pointer"
        @click="updateSorter('currentPrice')"
    >
      {{ print("current_price") }}
    </div>
    <div
        class="flex pl-4 pr-4 w-36 items-center align-center text-gray-600 dark:text-white font-bold cursor-pointer"
        @click="updateSorter('marketCap')"
    >
      {{ print("market_cap") }}
    </div>
    <div
        class="flex pl-4 pr-4 w-36 items-center align-center text-gray-600 dark:text-white font-bold cursor-pointer"
        @click="updateSorter('totalVolume')"
    >
      {{ print("total_volume") }}
    </div>
    <div
        class="flex flex-1 w-300 items-center align-center justify-center text-gray-600 dark:text-white font-bold cursor-pointer"
        @click="updateSorter('sparklineIn7d')"
    >
      {{ print("last_7_day") }}
    </div>
  </div>
</template>

<style lang="scss">
#app.light {
  .dyn-order {
    background-color: rgba(1, 1, 1, 0.03);
    border-radius: 100px;
  }
}

#app.dark {
  .dyn-order {
    background-color: rgba(255, 255, 255, 0.03);
    border-radius: 100px;
  }
}
</style>
