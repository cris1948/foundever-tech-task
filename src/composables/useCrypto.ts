import { PricesByCurrencies, TCryptoData, TEntryCategoryData, TEntryCryptoData } from "@/types/crypto.types";
import useLocalStorage from "@/composables/useLocalStorage";
import { LOCALSTORAGE_CRYPTO_CURRENCY, LOCALSTORAGE_CRYPTO_FAVORITES } from "@/app.storages";
import { computed, ref } from "vue";
import axios from "axios";

const _loadFavorites = (): Map<string, TCryptoData> => {
    const favorites: [ string, TCryptoData ][] = useLocalStorage.get(LOCALSTORAGE_CRYPTO_FAVORITES)
    if (favorites && Object.entries(favorites).length) {
        const map = new Map<string, TCryptoData>();
        for (const [ key, value ] of Object.values(favorites)) map.set(key, value);
        return map
    } else return new Map();
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

const URL_API = "https://api.coingecko.com/api/v3";

const cryptoList = ref(new Map<string, TCryptoData>());
const currenciesList = ref([]);
const categoriesList = ref([]);
const currencyActive = ref();
const categoryActive = ref(null);
const cryptoFavorites = ref(new Map<string, TCryptoData>());

export function useCrypto() {
    currencyActive.value = useLocalStorage.get(LOCALSTORAGE_CRYPTO_CURRENCY) || 'eur'
    cryptoFavorites.value = _loadFavorites();

    const itemsByPage = ref(50);

    const isReadyCategories = computed(() => {
        return !!categoriesList.value.length;
    })
    const isReadyCurrencies = computed(() => {
        return !!currenciesList.value.length;
    })
    const isReadyCryptoList = computed(() => {
        return !!cryptoList.value.size;
    })
    const isInFavorites = computed(() => {
        return (itemId: string) => (!!cryptoFavorites.value.get(itemId))
    })


    async function fetchCurrenciesList(): Promise<void> {
        //DevNote: It's for cache API request for dev and not pay it ...
        if (!isReadyCurrencies.value) {
            const cacheCurrencies = useLocalStorage.get("temp_currencies");
            if (cacheCurrencies && Object.entries(cacheCurrencies).length) {
                currenciesList.value = cacheCurrencies;
                return
            }
            const response = await axios.get(
                `${ URL_API }/simple/supported_vs_currencies`
            );
            if (response.data.length) {
                currenciesList.value = response.data
            }
            useLocalStorage.set("temp_currencies", response.data);
        }
    }

    async function fetchCategoriesList(): Promise<void> {
        if (!isReadyCategories.value) {
            //DevNote: It's for cache API request for dev and not pay it ...
            const cacheCategories = useLocalStorage.get("temp_categories");

            if (cacheCategories && Object.entries(cacheCategories).length) {
                categoriesList.value = cacheCategories;
                return
            }
            const response = await axios.get(`${ URL_API }/coins/categories/list`);
            if (response.data.length) {
                response.data.forEach((e: TEntryCategoryData) => {
                    categoriesList.value.push({ id: e.category_id, name: e.name });
                });
            }
            useLocalStorage.set("temp_categories", categoriesList.value);

        }
    }

    async function fetchCryptoList(): Promise<void> {
        //DevNote: It's for cache API request for dev and not pay it ...
        if (!isReadyCryptoList.value) {
            const cacheCryptoList = useLocalStorage.get("temp_crypto");
            if (cacheCryptoList && Object.entries(cacheCryptoList).length) {
                cacheCryptoList.forEach(([ _, e ]: [ index: string, e: TCryptoData ]) => {
                    cryptoList.value.set(e.id, { ...e, pricesByCurrencies: {} });
                });
                return
            }
            const response = await axios.get(`${ URL_API }/coins/list`);
            if (response.data.length) {
                for (let e of response.data) {
                    cryptoList.value.set(e.id, { ...e, pricesByCurrencies: {} });
                }
            }
            useLocalStorage.set("temp_crypto", Array.from(cryptoList.value))
        }
    }

    async function fetchCryptosInfos(optimizedList: TCryptoData[]): Promise<void> {
        const requestIds = optimizedList.filter((crypto) =>
            !crypto.pricesByCurrencies[currencyActive]
        );
        if (requestIds.length) {
            const ids = requestIds.map((e) => e.id);

            const query = {
                ids: ids.join(","),
                vs_currency: currencyActive.value,
                per_page: itemsByPage.value,
                include_24h_vol: true,
                include_24hr_change: true,
                include_last_updated_at: true,
                sparkline: true,
                x_cg_demo_api_key: "CG-tZ24564qzng8dTFMHKCA1bWG" // @note: dev only :)
            };

            const response = await axios.get(`${ URL_API }/coins/markets`, {
                params: query,
            });

            if (response.data) {
                for (const entryCryptoData of response.data as TEntryCryptoData[]) {
                    const key = entryCryptoData.id;
                    const item = cryptoList.value.get(key);
                    if (item) {
                        const updatedItem = { ...item };
                        const calculatedSparkline = _calculateSparkline(entryCryptoData.sparkline_in_7d.price);
                        updatedItem.image = entryCryptoData.image;
                        updatedItem.calculatedSparkline = calculatedSparkline;
                        updatedItem.sparklineIn7d = entryCryptoData.sparkline_in_7d.price;
                        updatedItem.orderedSparkLabels = _orderedSparkLabels(calculatedSparkline || []);
                        updatedItem.pricesByCurrencies[currencyActive.value] = {
                            currentPrice: entryCryptoData.current_price,
                            marketCap: entryCryptoData.market_cap,
                            totalVolume: entryCryptoData.total_volume,
                            priceChange24h: entryCryptoData.price_change_24h,
                        };
                        cryptoList.value.set(key, updatedItem);
                        if (cryptoFavorites.value.get(key)) {
                            cryptoFavorites.value.set(key, updatedItem);
                        }
                    }
                }

            }
        }
    }


    function toggleFavorite(itemId: string) {
        const item = cryptoList.value.get(itemId)
        if (isInFavorites.value(itemId) && item) {
            removeFavorite(item);
        } else if (item) {
            addFavorite(item)
        }
    }

    function setCurrencyActive(currency: string) {
        currencyActive.value = currency;
        useLocalStorage.set(LOCALSTORAGE_CRYPTO_CURRENCY, currencyActive.value);
    }


    function addFavorite(crypto: TCryptoData) {
        cryptoFavorites.value.set(crypto.id, {
            id: crypto.id,
            name: crypto.name,
            symbol: crypto.name,
            pricesByCurrencies: {}
        });
        useLocalStorage.set(LOCALSTORAGE_CRYPTO_FAVORITES, Array.from(cryptoFavorites.value));
    }

    function removeFavorite(crypto: TCryptoData) {
        cryptoFavorites.value.delete(crypto.id);
        useLocalStorage.set(LOCALSTORAGE_CRYPTO_FAVORITES, Array.from(cryptoFavorites.value));
    }

    return {
        cryptoList,
        currenciesList,
        categoriesList,
        currencyActive,
        categoryActive,
        cryptoFavorites,
        itemsByPage,

        isReadyCategories,
        isReadyCurrencies,
        isReadyCryptoList,
        isInFavorites,

        toggleFavorite,
        setCurrencyActive,
        addFavorite,
        removeFavorite,

        fetchCurrenciesList,
        fetchCategoriesList,
        fetchCryptoList,
        fetchCryptosInfos,
    }
}