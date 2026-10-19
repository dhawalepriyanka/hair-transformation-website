const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { listVisits, getVisit, createVisit, updateVisit, getPublicQueue, deleteVisit } = require('../controllers/patientController');

// Public route for TV Queue (No auth required, privacy-safe)
router.get('/public-queue', getPublicQueue);

router.use(verifyToken, requireRole('admin', 'receptionist'));
router.get('/', listVisits);
router.post('/', requireRole('admin', 'receptionist'), createVisit);
router.get('/:id', getVisit);
router.put('/:id', updateVisit);
router.delete('/:id', deleteVisit);

module.exports = router;
