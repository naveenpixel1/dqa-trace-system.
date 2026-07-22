const { z } = require('zod');

// This defines exactly what a valid production entry looks like
const logSchema = z.object({
  tenant_id: z.string().uuid('Invalid Tenant ID format.'),
  station_id: z.string().uuid('Invalid Station ID format.'),
  status: z.enum(['PASS', 'FAIL', 'REWORK'], {
    errorMap: () => ({ message: "Status must be PASS, FAIL, or REWORK." })
  }),
  notes: z.string().optional()
});

const validateLogInput = (req, res, next) => {
  const result = logSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      errors: result.error.errors.map(err => err.message)
    });
  }
  next(); // Data is clean! Pass it to the controller.
};

module.exports = { validateLogInput };