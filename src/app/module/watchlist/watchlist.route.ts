import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { WatchlistController } from './watchlist.controller.js';


const router = Router();

router.use(checkAuth());

router.get('/', WatchlistController.getWatchlist);
router.post('/:mediaId', WatchlistController.addToWatchlist);
router.delete('/:mediaId', WatchlistController.removeFromWatchlist);
router.get('/check/:mediaId', WatchlistController.isInWatchlist);

export const WatchlistRoutes = router;