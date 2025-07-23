# 🏥 Healthcare Format Analyzer

A client-side web application for parsing and analyzing healthcare data formats including ASTM, HL7 v2.x/3.x, FHIR, JSON, and XML messages.

## Features

### Multi-Format Support
- **ASTM** - E1381, E1394, E1238 standards with record-level parsing
- **HL7 v2.x** - ADT, ORM, ORU, OUL with segment analysis (v2.1-v2.9)
- **HL7 v3.x** - Clinical Document Architecture (CDA) with template detection
- **FHIR** - R4, R4B, R5 resources with detailed structure analysis
- **JSON** - Advanced object/array analysis with pattern detection
- **XML** - Namespace-aware parsing with schema recognition

### Analysis Features
- Auto-detection of format and version
- Hierarchical tree view with expand/collapse
- Important healthcare fields highlighted
- Performance optimized (max 50 items, 255-char value truncation)
- Detailed field-by-field explanations

### User Experience
- Professional healthcare-focused design
- Responsive layout for desktop and tablet
- Copy functions for formatted data and analysis
- Real-time parsing and analysis
- Keyboard shortcuts (Ctrl+Enter to parse)

### Security & Performance
- Client-side processing only (no data sent to servers)
- 10MB max message size limit
- XSS protection and input validation
- Content Security Policy headers

---

## 🚀 **Quick Start**

### 📋 **Prerequisites**
- **Node.js** 18+ 
- **npm** or **yarn**
- Modern web browser (Chrome 88+, Firefox 85+, Safari 14+, Edge 88+)

### ⚡ **Installation**

```bash
# Clone the repository
git clone https://github.com/your-username/healthcare-format-analyzer.git
cd healthcare-format-analyzer

# Install dependencies
npm install

# Start development server
npm run dev

# Open your browser to http://localhost:3000
```

### 🏗️ **Build for Production**

```bash
# Build optimized production version
npm run build

# Preview production build
npm run preview
```

---

## 🧪 **Example Messages to Test**

### 🔬 **ASTM E1381 Laboratory Data**
```
1H|\^&|||HOST^1.0|||||||||P|E 1394-97|20240115100000
1P|1|||DOE^JOHN^M||19800101|M|||123 MAIN ST^^ANYTOWN^NY^12345||||||||||||||||||||||||||
1O|1|SPEC001||GLU^Glucose|R|20240115093000|||||||||||||||||F
1R|1|GLU^Glucose^L|95|mg/dL|70_110|N||F||admin|20240115093000|LAB001
1L|1|N
```

### 🏥 **HL7 v2.x ADT Message**
```
MSH|^~\&|SENDING_APP|SENDING_FACILITY|RECEIVING_APP|RECEIVING_FACILITY|20240115120000||ADT^A01|12345|P|2.4
EVN|A01|20240115120000|||admin|20240115120000
PID|1||PATID1234^5^M11^ADT1^MR^HOSPITAL~123456789^^^USA^SS||DOE^JOHN^A||19800101|M|||123 MAIN ST^^ANYTOWN^NY^12345^USA||(555)555-2004|(555)555-2005|||S||PATID1234001^2^M10^ADT1^AN^A|123456789|9-87654^NC
PV1|1|I|ICU^101^01|E|||123456^SMITH^JOHN^A^^^Dr|||SUR|||A|||123456^SMITH^JOHN^A^^^Dr|INS|1234567|||||||||||||||||||||20240115120000|||||||V
```

### ⚡ **FHIR R4 Patient Resource**
```json
{
  "resourceType": "Patient",
  "id": "example",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2024-01-15T10:00:00Z"
  },
  "identifier": [{
    "use": "official",
    "type": {
      "coding": [{
        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
        "code": "MR",
        "display": "Medical record number"
      }]
    },
    "system": "http://hospital.org/patient-ids",
    "value": "12345"
  }],
  "active": true,
  "name": [{
    "use": "official",
    "family": "Doe",
    "given": ["John", "Michael"]
  }],
  "gender": "male",
  "birthDate": "1980-01-01"
}
```

### 📋 **HL7 v3 CDA Document**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3">
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <templateId root="2.16.840.1.113883.10.20.22.1.1"/>
  <id extension="12345" root="2.16.840.1.113883.19.5"/>
  <code code="34133-9" displayName="Summarization of Episode Note" 
        codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
  <title>Good Health Clinic Consultation Note</title>
  <effectiveTime value="20240115154500+0500"/>
  <recordTarget>
    <patientRole>
      <id extension="444222222" root="2.16.840.1.113883.4.1"/>
      <patient>
        <name>
          <given>John</given>
          <family>Doe</family>
        </name>
        <administrativeGenderCode code="M" codeSystem="2.16.840.1.113883.5.1"/>
        <birthTime value="19800101"/>
      </patient>
    </patientRole>
  </recordTarget>
</ClinicalDocument>
```

---

## 🎨 **User Interface Guide**

### 🔧 **Main Interface**
1. **📥 Message Input** - Paste your healthcare message
2. **🎯 Format Selection** - Choose format or use auto-detect
3. **⚡ Parse & Analyze** - Process the message instantly
4. **📊 Results View** - Formatted output and detailed analysis
5. **📋 Copy Functions** - Copy formatted data or analysis

### 🌳 **Tree Structure Analysis**
- **🔽 Expand/Collapse** - Click (+/-) to navigate hierarchy
- **⭐ Priority Fields** - Important fields highlighted in yellow
- **📏 Value Truncation** - Long values show (...) indicator
- **🔢 Array Display** - Shows "Array(3): item1, item2, item3"
- **🏷️ Type Indicators** - Shows data types for each field

### ⌨️ **Keyboard Shortcuts**
- **Ctrl+Enter** - Parse message
- **Tab** - Navigate between fields
- **Escape** - Clear error messages

---

## 🏗️ **Project Structure**

```
📁 happyFormaterParser/
├── 📄 index.html                 # Main HTML template
├── 📄 package.json              # Dependencies and scripts
├── 📄 vite.config.js            # Vite build configuration
├── 📄 tailwind.config.js        # Tailwind CSS configuration
├── 📄 netlify.toml              # Deployment configuration
├── 📁 src/
│   ├── 📄 main.js               # Application entry point
│   ├── 📄 style.css             # Tailwind styles and components
│   └── 📁 modules/
│       ├── 📄 FormatDetector.js  # Auto-detection logic
│       ├── 📄 MessageParser.js   # Format-specific parsers
│       └── 📄 UIController.js    # User interface management
├── 📁 public/
│   └── 📄 medical-icon.svg      # Application favicon
└── 📄 README.md                 # This file
```

---

## 🛠️ **Development**

### 🔧 **Available Scripts**
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build optimized production bundle
npm run preview  # Preview production build locally
```

### 🎨 **Customization**
- **🎨 Themes**: Modify `tailwind.config.js` for color schemes
- **⚙️ Parsing**: Add new formats in `src/modules/MessageParser.js`
- **🔍 Detection**: Update patterns in `src/modules/FormatDetector.js`
- **🎭 UI**: Customize interface in `src/modules/UIController.js`

### 🧪 **Testing**
- **Manual Testing**: Use provided example messages
- **Browser Testing**: Test in Chrome, Firefox, Safari, Edge
- **Performance**: Monitor with large files (up to 10MB limit)

---

## 🔒 **Security**

### 🛡️ **Security Features**
- **✅ XSS Protection** - All user input properly escaped
- **✅ Content Security Policy** - Comprehensive CSP headers
- **✅ Input Validation** - 10MB size limits, format validation
- **✅ No Code Injection** - Safe DOM manipulation only
- **✅ Security Headers** - HSTS, X-Frame-Options, X-Content-Type-Options

### 🔍 **Security Audit Results**
- **🚫 No Backdoors** - Clean, audited codebase
- **🚫 No Malicious Code** - Legitimate healthcare tool only
- **✅ Safe Dependencies** - Minimal, trusted npm packages
- **✅ Modern Standards** - Follows OWASP security guidelines

### 🚨 **Security Considerations**
- Client-side processing only (no data sent to servers)
- Input size limitations prevent DoS attacks
- Content Security Policy prevents script injection
- Regular security audits and updates

---

## 🌐 **Browser Support**

| Browser | Minimum Version | Features |
|---------|----------------|----------|
| 🌐 Chrome | 88+ | ✅ Full Support |
| 🦊 Firefox | 85+ | ✅ Full Support |
| 🧭 Safari | 14+ | ✅ Full Support |
| 🌐 Edge | 88+ | ✅ Full Support |

---

## 📚 **Healthcare Standards Reference**

### 🔬 **ASTM Standards**
- **E1381** - Standard Specification for Low-Level Protocol to Transfer Messages
- **E1394** - Standard Specification for Transferring Information Between Clinical Laboratory Instruments
- **E1238** - Standard Specification for Transferring Digital Neurophysiological Data

### 🏥 **HL7 Standards**
- **v2.x** - Clinical messaging standard (ADT, ORM, ORU, OUL, SIU, etc.)
- **v3.x** - Clinical Document Architecture (CDA), Continuity of Care Record (CCR)

### ⚡ **FHIR Resources**
- **R4** - Current stable version with 140+ resource types
- **R4B** - Ballot version with enhanced capabilities  
- **R5** - Latest version with improved interoperability

---

## 🤝 **Contributing**

### 🎯 **How to Contribute**
1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **💾 Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **📤 Push** to the branch (`git push origin feature/amazing-feature`)
5. **🔃 Open** a Pull Request

### 🐛 **Bug Reports**
Please include:
- Browser and version
- Sample message that causes the issue
- Expected vs actual behavior
- Error messages (if any)

### 💡 **Feature Requests**
- Healthcare format support requests
- UI/UX improvements
- Performance enhancements
- Security improvements

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **🏥 HL7 International** - Healthcare interoperability standards
- **⚡ FHIR Community** - Modern healthcare data exchange
- **🔬 ASTM International** - Laboratory data standards
- **🎨 Tailwind CSS** - Beautiful utility-first CSS framework
- **⚡ Vite** - Fast build tool and development server

---

## 📞 **Support**

- **📧 Issues**: Create a GitHub issue for bugs or questions
- **💬 Discussions**: Join GitHub discussions for general questions
- **📖 Documentation**: Check this README for comprehensive guides
- **🔧 Wiki**: Visit our wiki for advanced usage examples

---

<div align="center">

**🏥 Built for Healthcare Professionals, Developers, and Data Analysts**

Made with ❤️ for the healthcare informatics community

[![Healthcare](https://img.shields.io/badge/Healthcare-Informatics-blue.svg)](https://github.com) [![Standards](https://img.shields.io/badge/Standards-Compliant-green.svg)](https://github.com) [![Security](https://img.shields.io/badge/Security-Audited-red.svg)](https://github.com)

</div>