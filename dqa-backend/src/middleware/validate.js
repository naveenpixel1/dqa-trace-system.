const { z } = require('zod');

// Schema for production inspection logs
const logSchema = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required'),
  station_id: z.string().min(1, 'Station ID is required'),
  status: z.enum(['PASS', 'FAIL', 'REWORK'], {
    errorMap: () => ({ message: "Status must be PASS, FAIL, or REWORK." })
  }),
  shift: z.string().optional(),
  operator_name: z.string().optional(),
  serial_number: z.string().optional(),
  defects: z.array(z.string()).optional(),
  notes: z.string().optional()
});

const validateLogInput = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Invalid or missing request body',
      errors: ['Request body must be a valid JSON object'],
      timestamp: new Date().toISOString()
    });
  }

  const result = logSchema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const formattedErrors = issues.map(err => {
      const field = err.path && err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      return `${field}${err.message}`;
    });

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: formattedErrors,
      timestamp: new Date().toISOString()
    });
  }
  
  req.body = result.data; // Coerced and validated clean data
  next();
};

module.exports = { validateLogInput };