/**
 * Card Collection routes - secondary progression (Royal Match-style collectible cards).
 *
 * Players can view their collection, open card packs for coins, and convert
 * duplicate cards into coins. Completing a set grants a set reward.
 */

import express from 'express';
import { Logger } from '../core/logger/index.js';
import security from '../core/security/index.js';
import {
  cardFor, cardsInSet, allSets, setGoal, evaluateCollection,
  openCardPack, convertDuplicates, PACK_COST_COINS, PACK_CARD_COUNT,
} from '../services/meta/card-collection.js';
import { accountEconomy } from '../services/economy/AccountEconomyService.js';

const router = express.Router();
const logger = new Logger('CardRoutes');

router.use(security.sessionValidation);

// View the player's card collection with set completion progress.
router.get('/collection', async (req, res) => {
  try {
    const playerId = req.user.playerId;
    const cards = await accountEconomy.getCardCollection(playerId);

    // Convert to a Map for evaluation, then back to plain objects for the response.
    const collection = new Map(Object.entries(cards));
    const evaluation = evaluateCollection(collection);

    const cardDetails = {};
    for (const [cardId, count] of collection) {
      const def = cardFor(cardId);
      cardDetails[cardId] = { ...def, count };
    }

    res.json({
      success: true,
      cards: cardDetails,
      sets: evaluation.sets,
      totalCards: evaluation.totalCards,
      uniqueCards: evaluation.uniqueCards,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Card collection view failed', { error: error.message });
    res.status(500).json({ success: false, error: 'collection_error', requestId: req.requestId });
  }
});

// Open a card pack. Costs PACK_COST_COINS coins, draws PACK_CARD_COUNT random cards.
router.post('/pack', async (req, res) => {
  try {
    const playerId = req.user.playerId;
    const cards = await accountEconomy.getCardCollection(playerId);
    const collection = new Map(Object.entries(cards));

    const result = await openCardPack(playerId, accountEconomy, collection);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error, required: result.required, balance: result.balance, requestId: req.requestId });
    }

    // Persist the updated collection.
    await accountEconomy.setCardCollection(playerId, Object.fromEntries(result.collection));

    res.json({
      success: true,
      cards: result.cards,
      coinsDeducted: result.coinsDeducted,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Card pack open failed', { error: error.message });
    res.status(500).json({ success: false, error: 'pack_error', requestId: req.requestId });
  }
});

// Convert duplicate cards (all copies above 1 per card) into coins.
router.post('/convert', async (req, res) => {
  try {
    const playerId = req.user.playerId;
    const cards = await accountEconomy.getCardCollection(playerId);
    const collection = new Map(Object.entries(cards));

    const result = convertDuplicates(collection);
    if (!result.cardsConverted.length) {
      return res.status(200).json({ success: true, coinsEarned: 0, cardsConverted: [], message: 'No duplicates to convert', requestId: req.requestId });
    }

    // Grant coins for converted duplicates.
    await accountEconomy.updateCurrency(playerId, 'coins', result.coinsEarned, 'earn', 'card_convert');

    // Persist the deduplicated collection.
    await accountEconomy.setCardCollection(playerId, Object.fromEntries(result.collection));

    res.json({
      success: true,
      coinsEarned: result.coinsEarned,
      cardsConverted: result.cardsConverted,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Card convert failed', { error: error.message });
    res.status(500).json({ success: false, error: 'convert_error', requestId: req.requestId });
  }
});

// Public catalog info: card definitions and set structure (no player state).
router.get('/catalog', (_req, res) => {
  res.json({
    success: true,
    cards: Object.values(allSets()).flatMap(s => cardsInSet(s.id)),
    sets: allSets().map(s => ({ id: s.id, name: s.name, goal: setGoal(s.id), reward: s.reward })),
    packCostCoins: PACK_COST_COINS,
    packCardCount: PACK_CARD_COUNT,
    requestId: undefined,
  });
});

export default router;
