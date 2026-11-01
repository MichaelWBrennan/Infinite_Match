/**
 * Experiment routes - A/B testing for LiveOps monetization and retention.
 *
 * Endpoints:
 *  GET    /api/experiments          - list all registered experiments
 *  GET    /api/experiments/:id      - get one experiment definition
 *  POST   /api/experiments/assign   - stickily assign a player to a variant
 *  POST   /api/experiments/convert  - record a conversion event
 *  GET    /api/experiments/:id/results - compute results (conversion, lift)
 */

import express from 'express';
import { Logger } from '../core/logger/index.js';
import security from '../core/security/index.js';
import {
  listExperiments, getExperiment, assignPlayer, stickyAssign,
  recordAssignment, recordConversion, computeResults,
} from '../services/experiments/experiment-service.js';

export { stickyAssign };

const router = express.Router();
const logger = new Logger('ExperimentsRoutes');

router.use(security.sessionValidation);

// List all registered experiments (definitions only, no player state).
router.get('/', (_req, res) => {
  res.json({ success: true, experiments: listExperiments(), requestId: undefined });
});

// Get one experiment definition.
router.get('/:id', (req, res) => {
  const experiment = getExperiment(req.params.id);
  if (!experiment) {
    return res.status(404).json({ success: false, error: 'experiment_not_found', requestId: req.requestId });
  }
  res.json({ success: true, experiment, requestId: req.requestId });
});

// Stickily assign the player to a variant for an experiment.
// Body: { experimentId } — optional segment attributes can be included.
router.post('/assign', async (req, res) => {
  try {
    const playerId = req.user.playerId;
    const { experimentId } = req.body || {};
    if (!experimentId) {
      return res.status(400).json({ success: false, error: 'experimentId required', requestId: req.requestId });
    }

    const experiment = getExperiment(experimentId);
    if (!experiment) {
      return res.status(404).json({ success: false, error: 'experiment_not_found', requestId: req.requestId });
    }

    const player = {
      level: req.body.level,
      payer: req.body.payer,
      ...req.body.segment,
    };

    const assignment = assignPlayer(experimentId, playerId, player);
    await recordAssignment(experimentId, playerId, assignment.variantId, assignment.inExperiment);

    const evt = { type: 'assign', userId: playerId, experiment: experimentId,
      variant: assignment.variantId, inExperiment: assignment.inExperiment, ts: Date.now() };
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    await fs.mkdir('monitoring/reports', { recursive: true });
    await fs.appendFile(path.join('monitoring/reports', 'experiments.jsonl'), JSON.stringify(evt) + '\n', 'utf-8');

    res.json({
      success: true,
      experimentId,
      variantId: assignment.variantId,
      variant: assignment.variant,
      inExperiment: assignment.inExperiment,
      config: assignment.inExperiment ? assignment.variant.config : null,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Assign error', { error: error.message });
    res.status(500).json({ success: false, error: 'assign_error', requestId: req.requestId });
  }
});

// Record a conversion event for an experiment variant.
// Body: { experimentId, variantId, event, value }
router.post('/convert', async (req, res) => {
  try {
    const playerId = req.user.playerId;
    const { experimentId, variantId, event, value = 1 } = req.body || {};
    if (!experimentId || !event) {
      return res.status(400).json({ success: false, error: 'experimentId and event required', requestId: req.requestId });
    }
    await recordConversion(experimentId, playerId, variantId, event, value);
    res.json({ success: true, requestId: req.requestId });
  } catch (error) {
    logger.error('Conversion error', { error: error.message });
    res.status(500).json({ success: false, error: 'conversion_error', requestId: req.requestId });
  }
});

// Compute experiment results: conversion rate, lift vs control, sample sizes.
router.get('/:id/results', async (req, res) => {
  try {
    const results = await computeResults(req.params.id);
    if (!results) {
      return res.status(404).json({ success: false, error: 'experiment_not_found', requestId: req.requestId });
    }
    res.json({ success: true, results, requestId: req.requestId });
  } catch (error) {
    logger.error('Results error', { error: error.message });
    res.status(500).json({ success: false, error: 'results_error', requestId: req.requestId });
  }
});

export default router;
