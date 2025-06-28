# EHR Insurance Verification Integration

A prototype Node.js application that demonstrates EHR integration for real-time insurance status verification using FHIR standards. This project showcases how to connect Electronic Health Records with insurance payer systems for automated eligibility checking.

## 🏥 Overview

This integration prototype simulates a real-world scenario where healthcare providers need to verify patient insurance coverage before appointments or procedures. The system:

- Fetches patient demographics from FHIR-compliant EHR systems
- Retrieves insurance coverage information from patient records
- Performs mock insurance eligibility verification (simulating EDI 270/271 transactions)
- Returns comprehensive verification results with benefits details

## 🚀 Features

- **FHIR R4 Integration**: Connects to standard FHIR servers for patient data retrieval
- **Insurance Verification**: Mock payer verification with realistic response simulation
- **RESTful API**: Clean endpoints for single and batch verification operations
- **Error Handling**: Robust error management with detailed logging
- **Extensible Architecture**: Easy to add real payer integrations
- **Development Ready**: Includes comprehensive testing examples and documentation

## 📋 Prerequisites

- **Node.js** 16.0 or higher
- **npm** or **yarn** package manager
- Basic understanding of REST APIs and healthcare data standards
- Text editor or IDE (VS Code recommended)

## 🛠️ Installation & Setup

### 1. Clone or Create Project
```bash
mkdir ehr-insurance-verification
cd ehr-insurance-verification
```

### 2. Initialize Package
Copy the provided `package.json` or run:
```bash
npm init -y
```

### 3. Install Dependencies
```bash
npm install express axios cors dotenv
npm install --save-dev nodemon jest supertest
```

### 4. Environment Configuration
Create a `.env` file:
```bash
PORT=3000
NODE_ENV=development
FHIR_BASE_URL=https://launch.smarthealthit.org/v/r4/fhir
```

### 5. Add the Server Code
Save the provided server code as `server.js` in your project root.

### 6. Start the Application
```bash
# Development mode (auto-reload on changes)
npm run dev

# Production mode
npm start
```

The server will start on http://localhost:3000

## 🧪 Testing the Integration

### Health Check
Verify the server is running:

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**Bash/curl:**
```bash
curl http://localhost:3000/health
```

### Find Available Patients
Since FHIR test servers reset periodically, search for current patient IDs:

**PowerShell:**
```powershell
# Search for any patients
Invoke-RestMethod -Uri "http://localhost:3000/api/patients/search?limit=5"

# Search by name
Invoke-RestMethod -Uri "http://localhost:3000/api/patients/search?name=smith&limit=3"
```

**Bash/curl:**
```bash
# Search for any patients
curl "http://localhost:3000/api/patients/search?limit=5"

# Search by name
curl "http://localhost:3000/api/patients/search?name=smith&limit=3"
```

### Single Patient Verification
Use a patient ID from the search results:

**PowerShell:**
```powershell
# Get patient demographics
Invoke-RestMethod -Uri "http://localhost:3000/api/patient/PATIENT_ID_HERE"

# Get insurance coverage
Invoke-RestMethod -Uri "http://localhost:3000/api/coverage/PATIENT_ID_HERE"

# Full insurance verification
$body = @{
    patientId = "PATIENT_ID_HERE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/verify-insurance" -Method POST -Body $body -ContentType "application/json"
```

**Bash/curl:**
```bash
# Get patient demographics
curl http://localhost:3000/api/patient/PATIENT_ID_HERE

# Get insurance coverage
curl http://localhost:3000/api/coverage/PATIENT_ID_HERE

# Full insurance verification
curl -X POST http://localhost:3000/api/verify-insurance \
  -H "Content-Type: application/json" \
  -d '{"patientId": "PATIENT_ID_HERE"}'
```

### Batch Verification
Verify multiple patients at once:

**PowerShell:**
```powershell
$body = @{
    patientIds = @("ID1", "ID2", "ID3")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/verify-batch" -Method POST -Body $body -ContentType "application/json"
```

**Bash/curl:**
```bash
curl -X POST http://localhost:3000/api/verify-batch \
  -H "Content-Type: application/json" \
  -d '{"patientIds": ["ID1", "ID2", "ID3"]}'
```

## 📚 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/api/patients/search` | Search for available patients |
| `GET` | `/api/patient/:id` | Get patient demographics |
| `GET` | `/api/coverage/:patientId` | Get insurance coverage |
| `POST` | `/api/verify-insurance` | Single patient verification |
| `POST` | `/api/verify-batch` | Batch patient verification |

### Response Examples

**Patient Search Response:**
```json
{
  "success": true,
  "patients": [
    {
      "id": "example-patient-1",
      "firstName": "John",
      "lastName": "Doe",
      "birthDate": "1990-01-01",
      "gender": "male"
    }
  ],
  "total": 1
}
```

**Insurance Verification Response:**
```json
{
  "success": true,
  "patient": {
    "id": "example-patient-1",
    "firstName": "John",
    "lastName": "Doe",
    "birthDate": "1990-01-01",
    "gender": "male"
  },
  "coverage": {
    "id": "coverage-123",
    "status": "active",
    "subscriberId": "12345"
  },
  "verification": {
    "status": "success",
    "eligible": true,
    "payerName": "Blue Cross Blue Shield",
    "effectiveDate": "2024-01-01",
    "terminationDate": "2024-12-31",
    "copay": "$25.00",
    "deductible": "$1,500.00",
    "deductibleMet": "$450.00",
    "benefits": [
      {
        "service": "Office Visit",
        "coverage": "Covered",
        "copay": "$25.00"
      }
    ]
  }
}
```

## 🏗️ Architecture Overview

### Core Components

1. **FHIRHelper Class**
   - Handles FHIR server communication
   - Extracts and normalizes patient/coverage data
   - Manages API errors and retries

2. **InsuranceVerificationService**
   - Simulates real payer EDI transactions
   - Mock eligibility responses with realistic data
   - Extensible for real payer integrations

3. **REST API Layer**
   - Express.js routes for client integration
   - Request validation and error handling
   - Batch processing capabilities

### Data Flow

```
Client Request → API Validation → FHIR Data Fetch → Insurance Verification → Response
```

1. Client sends verification request with patient ID
2. Server validates request and fetches patient data from FHIR server
3. Insurance verification service processes eligibility check
4. Comprehensive response returned with verification results

## 🔧 Configuration Options

### FHIR Server Configuration
Update the FHIR server URL in your `.env` file:

```bash
# SMART Health IT (recommended for development)
FHIR_BASE_URL=https://launch.smarthealthit.org/v/r4/fhir

# HAPI FHIR (gets reset regularly)
FHIR_BASE_URL=https://hapi.fhir.org/baseR4

# Synthea (synthetic patient data)
FHIR_BASE_URL=https://synthea.mitre.org/fhir
```

### Mock Payer Configuration
Modify the `mockPayers` object in `InsuranceVerificationService` to add more insurance companies:

```javascript
this.mockPayers = {
  'CUSTOM001': {
    name: 'Custom Insurance',
    active: true,
    verificationEndpoint: 'mock'
  }
};
```

## 🚀 Development Roadmap

### Phase 1: Enhanced FHIR Integration ✨
- [ ] Add SMART on FHIR OAuth2 authentication
- [ ] Support for protected FHIR servers
- [ ] Extended resource support (Practitioner, Organization)
- [ ] FHIR search parameter optimization

### Phase 2: Real Insurance Integration 🏥
- [ ] EDI clearinghouse connections
- [ ] X12 270/271 transaction processing
- [ ] Real payer API integrations
- [ ] Claims status checking (276/277)

### Phase 3: Enterprise Features 🔒
- [ ] Database persistence layer
- [ ] Verification result caching
- [ ] Audit logging and compliance
- [ ] Rate limiting and security

### Phase 4: Production Readiness 🏭
- [ ] HIPAA compliance measures
- [ ] Performance optimization
- [ ] Monitoring and alerting
- [ ] Docker containerization

## 🧪 Testing & Development

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=verification

# Run tests in watch mode
npm test -- --watch
```

### Development Tools

**Recommended VS Code Extensions:**
- REST Client (for API testing)
- Thunder Client (Postman alternative)
- FHIR Tools
- JSON Viewer

**Additional Testing Tools:**
- Postman for API testing
- Insomnia for REST API development
- FHIR Validator for resource validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow FHIR R4 specifications
- Implement comprehensive error handling
- Add tests for new features
- Document API changes
- Maintain backward compatibility

## 📝 Common Issues & Solutions

### Patient Not Found Errors
**Problem:** Getting 404 errors when testing with patient IDs
**Solution:** Use the patient search endpoint first to find valid IDs:
```bash
curl "http://localhost:3000/api/patients/search?limit=5"
```

### CORS Errors in Browser
**Problem:** Cross-origin request blocked
**Solution:** CORS is already configured, but ensure you're making requests from the correct origin

### FHIR Server Timeouts
**Problem:** Slow responses from FHIR servers
**Solution:** Switch to a different FHIR server in your `.env` file or implement retry logic

### Port Already in Use
**Problem:** Port 3000 is occupied
**Solution:** Change the port in your `.env` file:
```bash
PORT=3001
```

## 🔐 Security Considerations

⚠️ **Important Security Notes:**

- This is a **prototype for educational purposes only**
- **Never use real patient data** in development/testing
- For production use, implement:
  - Proper authentication and authorization
  - HIPAA-compliant data handling
  - Encrypted data transmission
  - Audit logging
  - Rate limiting
  - Input validation and sanitization

## 📖 Learning Resources

### FHIR & Healthcare Standards
- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [SMART on FHIR](https://smarthealthit.org/)
- [HL7 FHIR University](https://www.hl7.org/fhir/university/)

### Insurance & EDI
- [EDI 270/271 Specifications](https://x12.org/)
- [Healthcare EDI Transactions](https://www.cms.gov/Medicare/Billing/ElectronicBillingEDITrans)

### Development
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [REST API Design](https://restfulapi.net/)
- [Express.js Documentation](https://expressjs.com/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For questions, issues, or feature requests:
1. Check the [Common Issues](#-common-issues--solutions) section
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Join the discussion in the project's community forums

---

**Built with ❤️ for the healthcare interoperability community**

*This project demonstrates the potential of FHIR-based integrations for improving healthcare workflows and patient care coordination.*
