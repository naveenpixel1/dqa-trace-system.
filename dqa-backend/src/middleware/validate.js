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