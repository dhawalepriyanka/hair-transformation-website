const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { listVisits, getVisit, createVisit, updateVisit } = require('../controllers/patientController');

router.use(verifyToken, requireRole('admin', 'receptionist'));
router.get('/', listVisits);
router.post('/', requireRole('admin', 'receptionist'), createVisit);
router.get('/:id', getVisit);
router.put('/:id', updateVisit);

module.exports = router;
