import InstrumentService from "../services/instruments.service.js";
import MarketDataService from "../services/marketData.service.js";

class MarketDataController {

  // Start tracking a symbol
  static async setSymbol(req, res) {
    try {
      const { symbol } = req.body;
      if (!symbol) {
        return res.status(400).json({ error: "symbol required" });
      }

      const token = await InstrumentService.symbolToToken(symbol);
      await MarketDataService.start(symbol, token);

      res.json({
        status: "STARTED",
        symbol: symbol.toUpperCase(),
        token
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // REST LTP endpoint
  static async getLTP(req, res) {
    try {
      const data = await MarketDataService.getLTP();
      res.json({
        symbol: MarketDataService.getState().activeSymbol,
        ...data
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default MarketDataController;
