import { Router } from 'express';
import SystemController from '../controllers/systemController';

const router = Router();
const systemController = new SystemController();

router.post('/system', systemController.createSystem);
router.get('/system', systemController.getSystem);

export default function setRoutes(app) {
    app.use('/api', router);
}