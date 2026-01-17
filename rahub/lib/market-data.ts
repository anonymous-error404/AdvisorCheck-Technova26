// Mock service - in production, integrate with real APIs like NSE, Finnhub, etc.
// Returns current market price for given symbol

interface StockPrice {
  symbol: string
  price: number
  timestamp: Date
  change: number
  changePercent: number
}

// Mock data for common stocks
const mockPrices: Record<string, { price: number; change: number }> = {
  RELIANCE: { price: 2450.5, change: 25.5 },
  TCS: { price: 4120.75, change: -15.25 },
  INFY: { price: 1850.3, change: 45.1 },
  WIPRO: { price: 520.8, change: -10.5 },
  HDFC: { price: 2680.4, change: 30.2 },
  ICICI: { price: 1050.2, change: -5.8 },
  BAJAJFINSV: { price: 1850.5, change: 60.3 },
  MARUTI: { price: 13580.0, change: 200.5 },
}

export async function getLiveStockPrice(symbol: string): Promise<StockPrice> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const upperSymbol = symbol.toUpperCase()
  const mockData = mockPrices[upperSymbol]

  if (!mockData) {
    return {
      symbol: upperSymbol,
      price: Math.random() * 5000 + 100,
      timestamp: new Date(),
      change: (Math.random() - 0.5) * 100,
      changePercent: (Math.random() - 0.5) * 5,
    }
  }

  return {
    symbol: upperSymbol,
    price: mockData.price + (Math.random() - 0.5) * 50,
    timestamp: new Date(),
    change: mockData.change,
    changePercent: (mockData.change / mockData.price) * 100,
  }
}

export const STOCK_SYMBOLS = [
  "RELIANCE",
  "TCS",
  "INFY",
  "WIPRO",
  "HDFC",
  "ICICI",
  "BAJAJFINSV",
  "MARUTI",
  "AXIS",
  "SBIN",
]
