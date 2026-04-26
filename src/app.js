const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises');
const categoryRoutes = require('./routes/categories');
const muscleGroupRoutes = require('./routes/muscleGroups');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const authRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		return res.status(429).json({
			success: false,
			message: 'Too many authentication requests, please try again later.',
		});
	},
});

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/api/health', (req, res) => {
	return res.json({
		status: 'ok',
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
	});
});

app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/muscle-groups', muscleGroupRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;