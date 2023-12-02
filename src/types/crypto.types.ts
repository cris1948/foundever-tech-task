export type TCryptoDefaultStates = {
    itemsByPage: number;
    cryptoList: Map<string, TCryptoData>
    currenciesList: string[]
    categoriesList: TCategoryData[]
    currencyActive: string
    categoryActive: string | null
    cryptoFavorites: Map<string, TCryptoData>
}
export type TCryptoList = {
    [key: string]: TCryptoData
}

export type TEntryCryptoData = {
    id: string,
    image: string,
    current_price: number
    market_cap: number,
    total_volume: number,
    price_change_24h: number,
    sparkline_in_7d: {
        price: number[],
    },
}

export type PricesAttrs = {
    currentPrice: number
    marketCap: number,
    totalVolume: number,
    priceChange24h: number,
}

export type PricesByCurrencies = Record<string, PricesAttrs>

export type TCryptoData = {
    id: string
    name: string
    symbol: string
    image?: string
    category?: string,
    sparklineIn7d?: number[];
    calculatedSparkline?: false | number[],
    orderedSparkLabels?: string[],
    pricesByCurrencies: PricesByCurrencies
}

export type TEntryCategoryData = {
    category_id: string
    name: string
}

export type TCategoryData = {
    id: string,
    name: string,
}