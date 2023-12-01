import { defineStore } from "pinia";
import axios from "axios";
import useLocalStorage from "@/composables/useLocalStorage";
import { LOCALSTORAGE_CRYPTO_CURRENCY, LOCALSTORAGE_CRYPTO_FAVORITES } from "@/app.storages";
import type {
  TCryptoDefaultStates,
  TCryptoData,
  TEntryCategoryData,
  TEntryCryptoData,
} from "./crypto.types";

const URL_API = "https://api.coingecko.com/api/v3";

export const useCryptoStore = defineStore({
  id: "crypto",

  state: () =>
    ({
      itemsByPage: 20,
      cryptoList: new Map<string, TCryptoData>(),
      currenciesList: [],
      categoriesList: [],
      currencyActive: useLocalStorage.get(LOCALSTORAGE_CRYPTO_CURRENCY) || 'eur',
      categoryActive: null,
      cryptoFavorites: _loadFavorites(),
    } as TCryptoDefaultStates),

  getters: {
    
    isReadyCategories(state: TCryptoDefaultStates) {
      return state.categoriesList.length ? true : false;
    },
    isReadyCurrencies(state: TCryptoDefaultStates) {
      return state.currenciesList.length ? true : false;
    },
    isReadyCryptoList(state: TCryptoDefaultStates) {
      return state.cryptoList.size ? true : false;
    },
    isInFavorites(state: TCryptoDefaultStates) {
      return (itemId: string) => (!!state.cryptoFavorites.get(itemId))
    }

  },

  actions: {
    async fetchCurrenciesList(): Promise<void> {
      //DevNote: It's for cache API request for dev and not pay it ...
      if (!this.isReadyCurrencies) {
        const cacheCurrencies = useLocalStorage.get("temp_currencies");
        if (cacheCurrencies && Object.entries(cacheCurrencies).length) {
          this.currenciesList = cacheCurrencies;
        } 
        else {
          const response = await axios.get(
            `${URL_API}/simple/supported_vs_currencies`
          );
          if (response.data.length) this.currenciesList = response.data;
          useLocalStorage.set("temp_currencies", response.data);
        }
      }
    },

    async fetchCategoriesList(): Promise<void> {
      if (!this.isReadyCategories) {
        //DevNote: It's for cache API request for dev and not pay it ...
        const cacheCategories = useLocalStorage.get("temp_categories");

        if (cacheCategories && Object.entries(cacheCategories).length) {
          this.categoriesList = cacheCategories;
        }
        else {
          const response = await axios.get(`${URL_API}/coins/categories/list`);
          if (response.data.length)
            response.data.forEach((e: TEntryCategoryData) => {
              this.categoriesList.push({ id: e.category_id, name: e.name });
            });
          useLocalStorage.set("temp_categories", this.categoriesList);
        }
      }
    },

    async fetchCryptoList(): Promise<void> {
      //DevNote: It's for cache API request for dev and not pay it ...
      if (!this.isReadyCryptoList) {
        const cacheCryptoList = useLocalStorage.get("temp_crypto");
        if (cacheCryptoList && Object.entries(cacheCryptoList).length) {
          cacheCryptoList.forEach(([index, e]:[index: string, e: TCryptoData]) => {
            this.cryptoList.set(e.id, { ...e, pricesByCurrencies: {} });
          });
        } else {
          const response = await axios.get(`${URL_API}/coins/list`);
          if (response.data.length)
            for (let e of response.data) {
              this.cryptoList.set(e.id, { ...e, pricesByCurrencies: {} });
            }
          useLocalStorage.set("temp_crypto", Array.from(this.cryptoList))
        }
      }
    },

    async fetchCryptosInfos(optimizedList: TCryptoData[]): Promise<void> {
      const requestIds = optimizedList.filter((crypto) =>
        !crypto.pricesByCurrencies[this.currencyActive]
      );
      if (requestIds.length) {
        const ids = requestIds.map((e) => e.id);

        const query = {
          ids: ids.join(","),
          vs_currency: this.currencyActive,
          per_page: this.itemsByPage,
          include_24h_vol: true,
          include_24hr_change: true,
          include_last_updated_at: true,
          sparkline: true,
          x_cg_demo_api_key: "CG-tZ24564qzng8dTFMHKCA1bWG"
        };

        const response = await axios.get(`${URL_API}/coins/markets`, {
          params: query,
        });

        if (response.data) {
          for (const entryCryptoData of response.data as TEntryCryptoData[]) {
            const key = entryCryptoData.id;
            const item = this.cryptoList.get(key);
            if (item) {
              const updatedItem = { ...item };
              const calculatedSparkline = _calculateSparkline(entryCryptoData.sparkline_in_7d.price);
              updatedItem.image = entryCryptoData.image;
              updatedItem.calculatedSparkline = calculatedSparkline;
              updatedItem.sparklineIn7d = entryCryptoData.sparkline_in_7d.price;
              updatedItem.orderedSparkLabels = _orderedSparkLabels(calculatedSparkline || []);
              updatedItem.pricesByCurrencies[this.currencyActive] = {
                currentPrice: entryCryptoData.current_price,
                marketCap: entryCryptoData.market_cap,
                totalVolume: entryCryptoData.total_volume,
                priceChange24h: entryCryptoData.price_change_24h,
              };
              this.cryptoList.set(key, updatedItem);
              if (this.cryptoFavorites.get(key)) this.cryptoFavorites.set(key, updatedItem);
            }
          }

        }
      }
    },


    toggleFavorite(itemId: string){
      const item = this.cryptoList.get(itemId)
      if (this.isInFavorites(itemId) && item) {
        this.removeFavorite(item);
      } else if (item) {
        this.addFavorite(item)
      };
    },

    setCurrencyActive(currency: string) {
      this.currencyActive = currency;
      useLocalStorage.set(LOCALSTORAGE_CRYPTO_CURRENCY, this.currencyActive);
    },

    addFavorite(crypto: TCryptoData) {
      this.cryptoFavorites.set(crypto.id, {
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.name,
        pricesByCurrencies: {}
      });
      useLocalStorage.set(LOCALSTORAGE_CRYPTO_FAVORITES, Array.from(this.cryptoFavorites));
    },

    removeFavorite(crypto: TCryptoData) {
      this.cryptoFavorites.delete(crypto.id);
      useLocalStorage.set(LOCALSTORAGE_CRYPTO_FAVORITES, Array.from(this.cryptoFavorites));
    },
  },
});

const _loadFavorites = (): Map<string,TCryptoData> => {
  const favorites: [string, TCryptoData][] = useLocalStorage.get(LOCALSTORAGE_CRYPTO_FAVORITES)
  if (favorites && Object.entries(favorites).length)
  {
    const map = new Map<string,TCryptoData>();
    for (const [key, value] of Object.values(favorites)) map.set(key, value);
    return map
  }
  else return new Map();
}

const _calculateSparkline = (sparklineIn7d: number[]): false | number[] => {
  if (!sparklineIn7d.length) {
    return false;
  }
  const reduced = sparklineIn7d.reduce((acc, val, index) => {
    if (index && index % 23 === 0) acc.push(val);
    return acc;
  }, new Array<number>());

  return reduced.length > 3 ? reduced : false;
};

const _orderedSparkLabels = (calculatedSparkline: number[]): string[] => {
  if (!calculatedSparkline) {
    return [];
  }
  return calculatedSparkline.map((_, index: number) => {
    if (calculatedSparkline) {
      return "J" + (index - calculatedSparkline.length);
    } else {
      return ""
    }
  });
};