// Master Asset Store & Default Seed Data for Tenants, Stations, and Standardized Defect Taxonomy

const TENANTS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Alpha Electronics - Unit 1',
    code: 'FAC-ALPHA-1',
    is_active: true
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'Beta Assembly Plant - Unit 2',
    code: 'FAC-BETA-2',
    is_active: true
  },
  {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    name: 'Gamma Precision Machining',
    code: 'FAC-GAMMA-3',
    is_active: true
  },
  {
    id: '8d0f1234-5678-90ab-cdef-1234567890ab',
    name: 'Delta Stamping & Welding',
    code: 'FAC-DELTA-4',
    is_active: true
  }
];

const STATIONS = [
  // Alpha Electronics (Unit 1)
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Bench 01 - SMT Circuit Inspection',
    code: 'SMT-01',
    is_active: true
  },
  {
    id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Bench 02 - Optical AOI Scanner',
    code: 'AOI-02',
    is_active: true
  },
  {
    id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Bench 03 - Final Enclosure QC',
    code: 'QC-03',
    is_active: true
  },

  // Beta Assembly Plant (Unit 2)
  {
    id: 'd4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f9a',
    tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'Station A - Chassis Mechanical Assembly',
    code: 'ASM-A',
    is_active: true
  },
  {
    id: 'e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
    tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'Station B - Wiring Harness Continuity Test',
    code: 'HAR-B',
    is_active: true
  },

  // Gamma Precision Machining
  {
    id: 'f6a7b89c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
    tenant_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    name: 'CNC Station 01 - Milling Integrity',
    code: 'CNC-01',
    is_active: true
  },
  {
    id: 'a7b89c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
    tenant_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    name: 'CNC Station 02 - Lathe Tolerance Check',
    code: 'CNC-02',
    is_active: true
  },

  // Delta Stamping & Welding
  {
    id: 'b89c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e',
    tenant_id: '8d0f1234-5678-90ab-cdef-1234567890ab',
    name: 'Welding Bench 01 - Laser Seam Quality',
    code: 'WLD-01',
    is_active: true
  }
];

const DEFECT_TAXONOMY = [
  {
    group: 'Mechanical & Dimensional',
    items: [
      { id: 'DEF-DIM', name: 'Dimension Out-of-Spec', description: 'Measurements outside specified tolerance limits' },
      { id: 'DEF-BURR', name: 'Burr', description: 'Rough or raised edge remaining after machining' },
      { id: 'DEF-CRACK', name: 'Crack', description: 'Structural fracture or fissure in material' },
      { id: 'DEF-DENT', name: 'Dent', description: 'Surface indentation or mechanical impact mark' },
      { id: 'DEF-ALIGN', name: 'Alignment Issue', description: 'Components misaligned relative to reference datum' }
    ]
  },
  {
    group: 'Surface & Finish',
    items: [
      { id: 'DEF-SCRATCH', name: 'Surface Scratch', description: 'Visible scratch or abrasion on finish' },
      { id: 'DEF-COLOR', name: 'Color Mismatch', description: 'Color shade variance against master target' },
      { id: 'DEF-PAINT', name: 'Paint Defect', description: 'Peeling, blistering, runs, or thin coating' },
      { id: 'DEF-THERMAL', name: 'Thermal Deformation', description: 'Heat distortion or heat discoloration' },
      { id: 'DEF-CONTAM', name: 'Contamination', description: 'Foreign particles, grease, or oil residues' }
    ]
  },
  {
    group: 'Assembly & Electrical',
    items: [
      { id: 'DEF-MISSING', name: 'Missing Component', description: 'Required part, fastener, or seal omitted' },
      { id: 'DEF-INCORRECT', name: 'Incorrect Assembly', description: 'Part installed backward, inverted, or wrong position' },
      { id: 'DEF-FASTENER', name: 'Loose Fastener', description: 'Torque specification not achieved' },
      { id: 'DEF-WELD', name: 'Weld Defect', description: 'Porosity, undercut, or incomplete penetration' },
      { id: 'DEF-SOLDER', name: 'Solder Defect', description: 'Cold joint, solder bridge, or voiding' }
    ]
  },
  {
    group: 'Material & Other',
    items: [
      { id: 'DEF-MAT', name: 'Material Defect', description: 'Raw material void, inclusion, or porosity' },
      { id: 'DEF-OTHER', name: 'Other', description: 'Unclassified defect requiring custom explanation' }
    ]
  }
];

module.exports = {
  TENANTS,
  STATIONS,
  DEFECT_TAXONOMY
};
