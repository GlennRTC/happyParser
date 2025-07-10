# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Healthcare Format Analyzer - A client-side web application for parsing and analyzing healthcare data formats including ASTM, HL7 v2.x/3.x, FHIR, JSON, and XML messages. Built with vanilla JavaScript and Vite for simplicity and security.

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build optimized production bundle  
npm run build

# Preview production build locally
npm run preview
```

## Architecture

The application follows a modular ES6 class-based architecture:

- **main.js** - Application entry point and orchestrator, renders HTML template and coordinates between modules
- **FormatDetector.js** - Smart format detection using regex patterns and confidence scoring
- **MessageParser.js** - Format-specific parsers with detailed field mappings for each healthcare standard
- **UIController.js** - Interactive tree-view rendering with expand/collapse, priority field highlighting, and performance optimization (50 item limit, 8-level depth)

### Core Design Patterns

- **Module Pattern**: Each major functionality is isolated in its own ES6 class
- **Strategy Pattern**: Different parsing strategies for each format type
- **Observer Pattern**: UI updates based on parsing results
- **Performance Optimization**: Built-in limits (10MB message size, 50 UI items, 8 tree depth levels) to prevent DoS

### Key Features

- **Auto-detection**: Confidence-based format identification using multiple regex patterns
- **Security-first**: XSS protection, input sanitization, CSP compliance, no server communication
- **Healthcare Standards**: Comprehensive support for major healthcare data formats with field-level descriptions
- **Interactive Analysis**: 8-level deep hierarchical tree view with priority field highlighting

## File Structure

```
src/
├── main.js                 # App orchestrator & HTML template
├── style.css              # Tailwind CSS + custom components  
└── modules/
    ├── FormatDetector.js   # Pattern-based format detection
    ├── MessageParser.js    # Format-specific parsing logic
    └── UIController.js     # Tree UI & performance management
```

## Healthcare Standards Support

- **HL7 v2.x**: Complete message type and segment definitions (MSH, PID, OBX, etc.)
- **HL7 v3.x**: CDA document parsing with template recognition  
- **FHIR**: R4/R4B/R5 resource type support with 40+ resource definitions
- **ASTM**: E1381/E1394/E1238 record type parsing (H/P/O/R/L records)
- **JSON/XML**: Generic parsing with structure analysis

## Security Considerations

- Client-side only processing (no data transmission)
- 10MB message size limit for DoS prevention
- XSS protection via DOM sanitization
- Content Security Policy compliance
- Input validation and error boundaries

## Performance Limits

- Max 50 analysis items displayed
- Max 8 levels of tree depth  
- 255 character value truncation
- Array preview limited to first 3 items
- XML parsing with error boundaries

## Customization Points

- Update format patterns in `FormatDetector.js` for new standards
- Add parsing logic in `MessageParser.js` for new formats
- Modify priority fields in `UIController.js` for different highlighting
- Adjust performance limits in `UIController.js` constructor