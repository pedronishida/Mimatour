/**
 * Rotas da API de viagens.
 * RESTful: GET /health, GET /trips, GET /trips/search, GET /trips/:id
 */

import { Router } from 'express';
import * as tripsController from '../controllers/tripsController.js';

const router = Router();

router.get('/health', tripsController.health);
router.get('/trips/search', tripsController.searchTrips);
router.get('/trips/:id', tripsController.getTripById);
router.get('/trips', tripsController.listTrips);

export default router;
