import { TradePublishService } from "../services/tradePublish.service.js";

const service = new TradePublishService();

export class TradePublishController {

  async publishTrade(req, res) {
    try {
      const trade = req.body;

      const result = await service.publishTrade(trade);

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: err.message || "Trade publishing failed"
      });
    }
  }
}
