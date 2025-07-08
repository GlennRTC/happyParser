# Healthcare Format Analyzer

A professional healthcare informatics format analyzer and parser for ASTM, HL7 v2.x/3.x, FHIR, JSON and XML messages.

## Features

- **Multi-format Support**: Parse and analyze ASTM, HL7 v2.x/3.x, FHIR, JSON, and XML healthcare messages
- **Auto-detection**: Automatically detect message format and version
- **Message Beautification**: Clean and format messages for better readability
- **Structure Analysis**: Detailed analysis of message structure and content
- **Field Identification**: Identify and describe individual fields and segments
- **Copy Functionality**: Separate copy buttons for formatted message and analysis
- **Medical Theme**: Clean, professional healthcare-themed design
- **Responsive**: Optimized for desktop and tablet use

## Supported Formats

### HL7 v2.x
- Message types: ADT, ORM, ORU, OUL, and many more
- Segment parsing: MSH, PID, OBX, OBR, etc.
- Field-level analysis with descriptions
- Version detection (v2.1 - v2.9)

### HL7 v3.x (CDA)
- Clinical Document Architecture
- XML-based document analysis
- Template ID and code extraction
- Structure analysis

### FHIR
- Support for FHIR R4, R4B, and R5
- JSON and XML format support
- Resource-specific analysis
- Version detection

### ASTM
- E1381, E1394, E1238 standards
- Record types: Header, Patient, Order, Result, etc.
- Field-level parsing

### JSON/XML
- Pretty printing and formatting
- Structure analysis
- Pattern detection

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Usage

1. Open the application in your browser
2. Paste your healthcare message in the input area
3. Select the format or use auto-detect
4. Click "Parse & Analyze" to process the message
5. View the formatted output and structural analysis
6. Copy the formatted message or analysis using the respective buttons
7. Use "Clear All" to reset the interface

## Project Structure

```
src/
├── main.js                 # Main application entry point
├── style.css              # Tailwind CSS styles and components
└── modules/
    ├── FormatDetector.js   # Format detection and version identification
    ├── MessageParser.js    # Message parsing for all formats
    └── UIController.js     # User interface management
```

## Technologies Used

- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Vanilla JavaScript**: Modern ES6+ modules
- **js-beautify**: JSON/JS formatting
- **fast-xml-parser**: XML parsing utilities

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.