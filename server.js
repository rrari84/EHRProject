// EHR Insurance Verification Integration - Node.js Setup
// This is a basic prototype for educational purposes

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock FHIR Server Configuration - Using more reliable server
const FHIR_BASE_URL = 'https://launch.smarthealthit.org/v/r4/fhir'; // SMART Health IT test server
// Alternative: 'https://hapi.fhir.org/baseR4' - Note: gets purged regularly

// Mock Insurance Verification Service
class InsuranceVerificationService {
  constructor() {
    // Mock payer database
    this.mockPayers = {
      'BCBS001': {
        name: 'Blue Cross Blue Shield',
        active: true,
        verificationEndpoint: 'mock'
      },
      'AETNA001': {
        name: 'Aetna',
        active: true,
        verificationEndpoint: 'mock'
      },
      'UHC001': {
        name: 'United Healthcare',
        active: true,
        verificationEndpoint: 'mock'
      }
    };
  }

  // Mock EDI 270 (Eligibility Request) / 271 (Response)
  async verifyEligibility(patientData, coverageData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const payerId = coverageData.payor?.[0]?.identifier?.[0]?.value;
    const payer = this.mockPayers[payerId];
    
    if (!payer) {
      return {
        status: 'error',
        message: 'Payer not recognized',
        eligible: false
      };
    }

    // Mock eligibility response
    return {
      status: 'success',
      eligible: Math.random() > 0.2, // 80% eligibility rate for demo
      payerName: payer.name,
      effectiveDate: '2024-01-01',
      terminationDate: '2024-12-31',
      copay: '$25.00',
      deductible: '$1,500.00',
      deductibleMet: '$450.00',
      benefits: [
        {
          service: 'Office Visit',
          coverage: 'Covered',
          copay: '$25.00'
        },
        {
          service: 'Preventive Care',
          coverage: 'Covered 100%',
          copay: '$0.00'
        }
      ],
      verificationDate: new Date().toISOString()
    };
  }
}

const insuranceService = new InsuranceVerificationService();

// FHIR Helper Functions
class FHIRHelper {
  static async getPatient(patientId) {
    try {
      const response = await axios.get(`${FHIR_BASE_URL}/Patient/${patientId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.error(`Patient ${patientId} not found on server ${FHIR_BASE_URL}`);
        throw new Error(`Patient with ID '${patientId}' not found. Try searching for patients first.`);
      }
      console.error('Error fetching patient:', error.message);
      throw new Error('Failed to fetch patient data');
    }
  }

  static async getCoverage(patientId) {
    try {
      const response = await axios.get(`${FHIR_BASE_URL}/Coverage?patient=${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching coverage:', error.message);
      return { entry: [] }; // Return empty if no coverage found
    }
  }

  static extractPatientInfo(patient) {
    const name = patient.name?.[0];
    return {
      id: patient.id,
      firstName: name?.given?.[0] || '',
      lastName: name?.family || '',
      birthDate: patient.birthDate,
      gender: patient.gender,
      phone: patient.telecom?.find(t => t.system === 'phone')?.value,
      address: patient.address?.[0]
    };
  }

  static extractCoverageInfo(coverage) {
    if (!coverage.entry || coverage.entry.length === 0) {
      return null;
    }

    const coverageResource = coverage.entry[0].resource;
    return {
      id: coverageResource.id,
      status: coverageResource.status,
      subscriberId: coverageResource.subscriberId,
      payor: coverageResource.payor,
      period: coverageResource.period
    };
  }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'EHR Insurance Verification API' });
});

// Search for patients (useful for finding valid IDs)
app.get('/api/patients/search', async (req, res) => {
  try {
    const { name, family, given, limit = 10 } = req.query;
    let searchUrl = `${FHIR_BASE_URL}/Patient?_count=${limit}`;
    
    if (name) {
      searchUrl += `&name=${encodeURIComponent(name)}`;
    }
    if (family) {
      searchUrl += `&family=${encodeURIComponent(family)}`;
    }
    if (given) {
      searchUrl += `&given=${encodeURIComponent(given)}`;
    }
    
    const response = await axios.get(searchUrl);
    const patients = response.data.entry?.map(entry => {
      const patient = entry.resource;
      return FHIRHelper.extractPatientInfo(patient);
    }) || [];
    
    res.json({
      success: true,
      patients: patients,
      total: response.data.total || patients.length,
      searchUrl: searchUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get patient information
app.get('/api/patient/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await FHIRHelper.getPatient(patientId);
    const patientInfo = FHIRHelper.extractPatientInfo(patient);
    
    res.json({
      success: true,
      patient: patientInfo
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Get coverage information
app.get('/api/coverage/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const coverage = await FHIRHelper.getCoverage(patientId);
    const coverageInfo = FHIRHelper.extractCoverageInfo(coverage);
    
    res.json({
      success: true,
      coverage: coverageInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Main insurance verification endpoint
app.post('/api/verify-insurance', async (req, res) => {
  try {
    const { patientId } = req.body;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID is required'
      });
    }

    // Fetch patient and coverage data from FHIR server
    const patient = await FHIRHelper.getPatient(patientId);
    const coverage = await FHIRHelper.getCoverage(patientId);
    
    const patientInfo = FHIRHelper.extractPatientInfo(patient);
    const coverageInfo = FHIRHelper.extractCoverageInfo(coverage);

    if (!coverageInfo) {
      return res.json({
        success: true,
        verification: {
          status: 'no_coverage',
          message: 'No insurance coverage found for patient'
        },
        patient: patientInfo
      });
    }

    // Perform insurance verification
    const verification = await insuranceService.verifyEligibility(patientInfo, coverageInfo);
    
    res.json({
      success: true,
      patient: patientInfo,
      coverage: coverageInfo,
      verification: verification
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Batch verification endpoint
app.post('/api/verify-batch', async (req, res) => {
  try {
    const { patientIds } = req.body;
    
    if (!Array.isArray(patientIds) || patientIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of patient IDs is required'
      });
    }

    const results = [];
    
    for (const patientId of patientIds) {
      try {
        const patient = await FHIRHelper.getPatient(patientId);
        const coverage = await FHIRHelper.getCoverage(patientId);
        
        const patientInfo = FHIRHelper.extractPatientInfo(patient);
        const coverageInfo = FHIRHelper.extractCoverageInfo(coverage);
        
        let verification = null;
        if (coverageInfo) {
          verification = await insuranceService.verifyEligibility(patientInfo, coverageInfo);
        }

        results.push({
          patientId,
          patient: patientInfo,
          coverage: coverageInfo,
          verification: verification || { status: 'no_coverage' }
        });
      } catch (error) {
        results.push({
          patientId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results: results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`EHR Insurance Verification API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('FHIR Server:', FHIR_BASE_URL);
});

module.exports = app;