# Mapeo completo de parsers (HL7 v2, v3/C-CDA, FHIR, ASTM) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada parser mapee y la UI muestre *todos* los niveles de información (segmento/registro → campo → repetición → componente → subcomponente; árbol XML/JSON completo), sin cambiar el diseño visual.

**Architecture:** Toda la lógica de mapeo vive en `MessageParser.js` (testeable en Node). Cada parser entrega `analysis.detailedStructure` como un objeto anidado con etiquetas legibles (`PID-5.1 Family Name`), y la UI existente (`processDeepTreeItem`) lo pinta tal cual. Los datos del resumen clínico (paciente, conteos) los calcula el parser. La UI solo pierde filtros/límites y código muerto; HTML/CSS no se tocan.

**Tech Stack:** Vanilla JS (ES modules), Vite 7, Tailwind. Tests con `node --test` (stdlib, Node 26). XML con `fast-xml-parser` 4.5.3 (ya instalado en `dependencies`, hoy sin usar).

**Spec:** Pedido del usuario (2026-09-22): "conservar la interfaz gráfica; que el parser de todos los estándares HL7 v2, v3, FHIR, ASTM pueda ver todos los niveles de información y mapee todo. HL7, por ejemplo, no mapea toda la info de PV1 ni PID." Hallazgos verificados con Node al preparar el plan:

| # | Bug confirmado | Dónde |
|---|---|---|
| 1 | Un HL7 v2 separado por `\r` (el separador estándar) se lee como **1 segmento** | `parseHL7v2` split `/\r?\n/` |
| 2 | Nombres de MSH desplazados una posición (`Encoding Characters` = `APP`) | `parseHL7Fields` |
| 3 | Solo se devuelven los **10 primeros campos no vacíos**: PV1-19, PV1-44 (Admit Date/Time), etc. se pierden | `.filter(f => f.value).slice(0, 10)` |
| 4 | PV1 sin definiciones; PID solo 15 de 39; sin componentes `^`, repeticiones `~`, subcomponentes `&` ni escapes | `parseHL7Fields` |
| 5 | La UI además filtra por palabras clave (`isClinicallyRelevant`) y corta a 5 campos → `PV1.3` nunca se ve | `UIController.addSimplifiedAnalysisSection` |
| 6 | ASTM **sin número de frame** (el formato que genera la propia app) → **0 registros** | regex `^(\d+)([A-Z])\|` |
| 7 | ASTM con frame: nombres desplazados (el nº de secuencia sale como `Practice Patient ID`); checksum se pega al último campo | `parseASTMFields` |
| 8 | El detector no reconoce ASTM sin frame, ni FHIR XML que no sea `Bundle`/`Patient`; `/C-CDA/i` clasifica como v3 cualquier FHIR que mencione "C-CDA"; versión `2.5.1` no se detecta | `FormatDetector.patterns` |
| 9 | FHIR/C-CDA: la UI descarta toda clave llamada `name` (→ `Patient.name` y `<name>` del paciente invisibles), corta a profundidad 10 y a 50/100 hijos | `processDeepTreeItem` |
| 10 | El árbol de Bundle FHIR y los resúmenes clínicos esperan una forma `{name, fields}` que ningún parser produce → nunca se ejecutan / resumen vacío | `createFHIRTreeStructure`, `generate*Summary` |
| 11 | `xmlToObject` descarta texto mixto (narrativa C-CDA `<text>No known <content>…`) | `xmlToObject` |
| 12 | `getFriendlyName` rompe claves con mayúsculas: `PID-5 Patient Name` → `P I D-5  Patient  Name` | regex `/([A-Z])/g` |
| 13 | **XSS**: el resumen clínico se inserta con `innerHTML` sin escapar (`resourceType`/tagName hoy; `patientName` tras este plan) | `displayClinicalSummary` |
| 14 | Crash latente: `getContextualFriendlyName(parentKey \|\| item.name)` recibe un array cuando un elemento de array tiene `name` (FHIR `contained: [Patient]`) → `name.replace is not a function` | `processDeepTreeItem` |

## Global Constraints

- No cambiar `index.html`, `src/style.css`, `tailwind.config.js` ni el markup/clases que genera `main.js`/`UIController.js`. "Preservar la interfaz gráfica" = mismo aspecto; solo cambia *qué* datos se muestran.
- Sin dependencias nuevas. `fast-xml-parser` ya está instalado; se elimina `js-beautify` (instalado y sin usar).
- Tests: `node --test` desde la raíz (`npm test`). Sin frameworks.
- Formas de salida que la UI ya consume se conservan: `format`, `version`, `formatted`, `analysis.{messageType, segmentCount, recordCount, version, resourceType, documentType, elementCount, detailedStructure}`.
- Límite de 10 MB de entrada se mantiene para XML/JSON (seguridad).
- Nomenclatura de etiquetas: HL7 `SEG-n Nombre`, componente `SEG-n.m Nombre`, subcomponente `SEG-n.m.s`. ASTM igual (`P-6.1 Last Name`).
- Rama: `fix/full-parser-mapping` (ya creada).

## Review Focus

1. **HL7 con `\r` solamente, `\r\n` o MLLP (`\x0b…\x1c`)** → siempre N segmentos. Test en Task 1.
2. **Delimitadores personalizados en MSH-2** (p. ej. `MSH|*~\&`) → componentes se separan con `*`. Test en Task 2.
3. **Segmentos repetidos** (varios OBX/NK1/DG1) → cada uno aparece por separado (`OBX #1`, `OBX #2`), ninguno sobrescribe al otro. Test en Task 2.
4. **Documentos grandes** (C-CDA de cientos de entradas) → si se alcanza `maxItems`, la UI lo *dice*; nunca un corte silencioso. Verificación manual en Task 7.
5. **Basura de transporte en valores**: escapes HL7 (`\T\`, `\.br\`), checksums ASTM, frames ETB partidos → no deben aparecer en los valores. Tests en Task 2 y Task 3.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `package.json` | Modificar | script `test`; quitar `js-beautify` |
| `src/modules/hl7v2Definitions.js` | Crear | Solo datos: nombres de campos por segmento y de componentes por tipo de dato HL7 v2.5.1 |
| `src/modules/MessageParser.js` | Modificar | Parsers HL7v2/ASTM/v3/FHIR/XML/JSON; helpers compartidos `fieldTree`, `decodeEscapes`, `parseXmlDocument` |
| `src/modules/FormatDetector.js` | Modificar | Patrones corregidos; borrar código muerto |
| `src/modules/UIController.js` | Modificar | Quitar filtros/límites, resúmenes desde `analysis`, árbol FHIR, borrar código muerto |
| `test/hl7v2.test.js`, `test/astm.test.js`, `test/hl7v3.test.js`, `test/fhir.test.js`, `test/detector.test.js` | Crear | Un archivo por estándar |

---

### Task 1: Arnés de tests + HL7 v2 lee todos los segmentos y todos los campos

**Files:**
- Modify: `package.json`
- Create: `src/modules/hl7v2Definitions.js`
- Modify: `src/modules/MessageParser.js` (`parseHL7v2`, `parseHL7Fields` → se reemplaza)
- Test: `test/hl7v2.test.js`

**Interfaces:**
- Produces: `HL7_SEGMENT_FIELDS: Record<string, Array<string | [string, string]>>` y `HL7_DATATYPE_COMPONENTS: Record<string, string[]>` exportados de `hl7v2Definitions.js`. Cada entrada de campo es `'Nombre'` o `['Nombre', 'TIPO']`.
- Produces: `parseHL7v2(message)` devuelve `analysis.segments[]` con `{ name, type, index, fields: [{ name, value, position, dataType }] }` — **todos** los campos, incluidos vacíos, `position` = número HL7 real (MSH-1 = `|`). Los delimitadores viven en una variable local `d = { field, component, repetition, escape, subcomponent }` y se pasan explícitos a los helpers (no se guardan en `this`).

- [ ] **Step 1: Añadir script de test**

En `package.json`, dentro de `"scripts"`, añadir `"test": "node --test"`:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "node --test"
  },
```

- [ ] **Step 2: Escribir los tests que fallan**

Crear `test/hl7v2.test.js`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MessageParser } from '../src/modules/MessageParser.js'

const p = new MessageParser()

// Built by position so the test never depends on counting pipes by hand
const seg = (type, values) => {
  const parts = [type]
  for (const [pos, v] of Object.entries(values)) parts[pos] = v
  return Array.from(parts, v => v ?? '').join('|')
}

export const PID = seg('PID', { 1: '1', 3: 'P1^^^HOSP^MR~M2^^^HOSP^MRN', 5: 'DOE^JOHN^Q', 7: '19800101', 8: 'M', 11: '1 Main St^^Springfield^IL^62701', 13: '(555)555-1234', 18: 'ACC1', 30: 'N' })
export const PV1 = seg('PV1', { 1: '1', 2: 'I', 3: 'W1^101^A', 4: 'E', 7: 'D1^SMITH^ANN', 10: 'MED', 19: 'V99', 44: '20240101120000' })
export const ADT = [
  'MSH|^~\\&|APP|FAC|HIS|HOSP|20240101120000||ADT^A01^ADT_A01|MSG001|P|2.5.1',
  PID,
  PV1,
  'OBX|1|NM|GLU^Glucose^L||95|mg/dL|70-110|N|||F',
  'OBX|2|ST|NOTE^Note^L||Line1\\.br\\Line2 \\T\\ more||||||F',
  'ZXX|a|b'
]

test('CR-only, LF, CRLF and MLLP framing all yield every segment', () => {
  for (const text of [ADT.join('\r'), ADT.join('\n'), ADT.join('\r\n'), `\x0b${ADT.join('\r')}\x1c\r`]) {
    assert.equal(p.parse(text, 'hl7v2').analysis.segmentCount, 6)
  }
})

test('MSH field names line up with HL7 positions', () => {
  const msh = p.parse(ADT.join('\r'), 'hl7v2').analysis.segments[0]
  const byPos = n => msh.fields.find(f => f.position === n)
  assert.deepEqual([byPos(1).name, byPos(1).value], ['Field Separator', '|'])
  assert.deepEqual([byPos(2).name, byPos(2).value], ['Encoding Characters', '^~\\&'])
  assert.deepEqual([byPos(3).name, byPos(3).value], ['Sending Application', 'APP'])
  assert.deepEqual([byPos(9).name, byPos(9).value], ['Message Type', 'ADT^A01^ADT_A01'])
})

test('every PID and PV1 field is returned with its standard name', () => {
  const { segments } = p.parse(ADT.join('\r'), 'hl7v2').analysis
  const pid = segments.find(s => s.type === 'PID')
  const pv1 = segments.find(s => s.type === 'PV1')
  assert.equal(pid.fields.length, 30)
  assert.equal(pv1.fields.length, 44)
  assert.deepEqual(pid.fields.find(f => f.position === 18), { name: 'Patient Account Number', value: 'ACC1', position: 18, dataType: 'CX' })
  assert.equal(pid.fields.find(f => f.position === 30).name, 'Patient Death Indicator')
  assert.equal(pv1.fields.find(f => f.position === 19).name, 'Visit Number')
  assert.deepEqual(pv1.fields.find(f => f.position === 44), { name: 'Admit Date/Time', value: '20240101120000', position: 44, dataType: 'TS' })
})

test('unknown segments fall back to positional names', () => {
  const zxx = p.parse(ADT.join('\r'), 'hl7v2').analysis.segments.find(s => s.type === 'ZXX')
  assert.deepEqual(zxx.fields.map(f => f.name), ['ZXX-1', 'ZXX-2'])
})

test('version and message type come from MSH-12 and MSH-9', () => {
  const r = p.parse(ADT.join('\r'), 'hl7v2')
  assert.equal(r.version, '2.5.1')
  assert.equal(r.analysis.messageType, 'ADT^A01 - Admission, discharge, transfer')
})

test('a message without MSH is rejected', () => {
  assert.throws(() => p.parse('PID|1||X', 'hl7v2'), /No MSH segment/)
})
```

- [ ] **Step 3: Correr y ver que falla**

Run: `npm test -- test/hl7v2.test.js`
Expected: FAIL — `segmentCount` 1 ≠ 6, nombres de MSH desplazados, `pv1.fields.length` distinto, etc.

- [ ] **Step 4: Crear `src/modules/hl7v2Definitions.js`**

Nombres HL7 v2.5.1. Un segmento sin entrada aquí (IN1, GT1, Z-segments…) cae a nombres posicionales `SEG-n`; ampliarlo es solo agregar un array.

```js
// HL7 v2.5.1 field names per segment. [name, dataType] when the type has components listed below.
export const HL7_SEGMENT_FIELDS = {
  MSH: ['Field Separator', 'Encoding Characters', ['Sending Application', 'HD'], ['Sending Facility', 'HD'],
    ['Receiving Application', 'HD'], ['Receiving Facility', 'HD'], ['Date/Time of Message', 'TS'], 'Security',
    ['Message Type', 'MSG'], 'Message Control ID', ['Processing ID', 'PT'], ['Version ID', 'VID'], 'Sequence Number',
    'Continuation Pointer', 'Accept Acknowledgment Type', 'Application Acknowledgment Type', 'Country Code',
    'Character Set', ['Principal Language of Message', 'CE'], 'Alternate Character Set Handling Scheme',
    ['Message Profile Identifier', 'EI']],
  EVN: ['Event Type Code', ['Recorded Date/Time', 'TS'], ['Date/Time Planned Event', 'TS'], 'Event Reason Code',
    ['Operator ID', 'XCN'], ['Event Occurred', 'TS'], ['Event Facility', 'HD']],
  PID: ['Set ID', ['Patient ID', 'CX'], ['Patient Identifier List', 'CX'], ['Alternate Patient ID', 'CX'],
    ['Patient Name', 'XPN'], ['Mother\'s Maiden Name', 'XPN'], ['Date/Time of Birth', 'TS'], 'Administrative Sex',
    ['Patient Alias', 'XPN'], ['Race', 'CE'], ['Patient Address', 'XAD'], 'County Code', ['Phone Number - Home', 'XTN'],
    ['Phone Number - Business', 'XTN'], ['Primary Language', 'CE'], ['Marital Status', 'CE'], ['Religion', 'CE'],
    ['Patient Account Number', 'CX'], 'SSN Number - Patient', ['Driver\'s License Number - Patient', 'DLN'],
    ['Mother\'s Identifier', 'CX'], ['Ethnic Group', 'CE'], 'Birth Place', 'Multiple Birth Indicator', 'Birth Order',
    ['Citizenship', 'CE'], ['Veterans Military Status', 'CE'], ['Nationality', 'CE'], ['Patient Death Date and Time', 'TS'],
    'Patient Death Indicator', 'Identity Unknown Indicator', 'Identity Reliability Code', ['Last Update Date/Time', 'TS'],
    ['Last Update Facility', 'HD'], ['Species Code', 'CE'], ['Breed Code', 'CE'], 'Strain', ['Production Class Code', 'CE'],
    ['Tribal Citizenship', 'CWE']],
  PD1: ['Living Dependency', 'Living Arrangement', ['Patient Primary Facility', 'XON'],
    ['Patient Primary Care Provider Name & ID No.', 'XCN'], 'Student Indicator', 'Handicap', 'Living Will Code',
    'Organ Donor Code', 'Separate Bill', ['Duplicate Patient', 'CX'], ['Publicity Code', 'CE'], 'Protection Indicator',
    'Protection Indicator Effective Date', ['Place of Worship', 'XON'], ['Advance Directive Code', 'CE'],
    'Immunization Registry Status', 'Immunization Registry Status Effective Date', 'Publicity Code Effective Date',
    'Military Branch', 'Military Rank/Grade', 'Military Status'],
  NK1: ['Set ID', ['Name', 'XPN'], ['Relationship', 'CE'], ['Address', 'XAD'], ['Phone Number', 'XTN'],
    ['Business Phone Number', 'XTN'], ['Contact Role', 'CE'], 'Start Date', 'End Date', 'Job Title', 'Job Code/Class',
    ['Employee Number', 'CX'], ['Organization Name', 'XON'], ['Marital Status', 'CE'], 'Administrative Sex',
    ['Date/Time of Birth', 'TS'], 'Living Dependency', 'Ambulatory Status', ['Citizenship', 'CE'], ['Primary Language', 'CE'],
    'Living Arrangement', ['Publicity Code', 'CE'], 'Protection Indicator', 'Student Indicator', ['Religion', 'CE'],
    ['Mother\'s Maiden Name', 'XPN'], ['Nationality', 'CE'], ['Ethnic Group', 'CE'], ['Contact Reason', 'CE'],
    ['Contact Person\'s Name', 'XPN'], ['Contact Person\'s Telephone Number', 'XTN'], ['Contact Person\'s Address', 'XAD'],
    ['Associated Party\'s Identifiers', 'CX'], 'Job Status', ['Race', 'CE'], 'Handicap',
    'Contact Person Social Security Number', 'Next of Kin Birth Place', 'VIP Indicator'],
  PV1: ['Set ID', 'Patient Class', ['Assigned Patient Location', 'PL'], 'Admission Type', ['Preadmit Number', 'CX'],
    ['Prior Patient Location', 'PL'], ['Attending Doctor', 'XCN'], ['Referring Doctor', 'XCN'], ['Consulting Doctor', 'XCN'],
    'Hospital Service', ['Temporary Location', 'PL'], 'Preadmit Test Indicator', 'Re-admission Indicator', 'Admit Source',
    'Ambulatory Status', 'VIP Indicator', ['Admitting Doctor', 'XCN'], 'Patient Type', ['Visit Number', 'CX'],
    ['Financial Class', 'FC'], 'Charge Price Indicator', 'Courtesy Code', 'Credit Rating', 'Contract Code',
    'Contract Effective Date', 'Contract Amount', 'Contract Period', 'Interest Code', 'Transfer to Bad Debt Code',
    'Transfer to Bad Debt Date', 'Bad Debt Agency Code', 'Bad Debt Transfer Amount', 'Bad Debt Recovery Amount',
    'Delete Account Indicator', 'Delete Account Date', 'Discharge Disposition', ['Discharged to Location', 'DLD'],
    ['Diet Type', 'CE'], 'Servicing Facility', 'Bed Status', 'Account Status', ['Pending Location', 'PL'],
    ['Prior Temporary Location', 'PL'], ['Admit Date/Time', 'TS'], ['Discharge Date/Time', 'TS'], 'Current Patient Balance',
    'Total Charges', 'Total Adjustments', 'Total Payments', ['Alternate Visit ID', 'CX'], 'Visit Indicator',
    ['Other Healthcare Provider', 'XCN']],
  PV2: [['Prior Pending Location', 'PL'], ['Accommodation Code', 'CE'], ['Admit Reason', 'CE'], ['Transfer Reason', 'CE'],
    'Patient Valuables', 'Patient Valuables Location', 'Visit User Code', ['Expected Admit Date/Time', 'TS'],
    ['Expected Discharge Date/Time', 'TS'], 'Estimated Length of Inpatient Stay', 'Actual Length of Inpatient Stay',
    'Visit Description', ['Referral Source Code', 'XCN'], 'Previous Service Date', 'Employment Illness Related Indicator',
    'Purge Status Code', 'Purge Status Date', 'Special Program Code', 'Retention Indicator',
    'Expected Number of Insurance Plans', 'Visit Publicity Code', 'Visit Protection Indicator',
    ['Clinic Organization Name', 'XON'], 'Patient Status Code', 'Visit Priority Code', 'Previous Treatment Date',
    'Expected Discharge Disposition', 'Signature on File Date', 'First Similar Illness Date',
    ['Patient Charge Adjustment Code', 'CE'], 'Recurring Service Code', 'Billing Media Code',
    ['Expected Surgery Date and Time', 'TS'], 'Military Partnership Code', 'Military Non-Availability Code',
    'Newborn Baby Indicator', 'Baby Detained Indicator', ['Mode of Arrival Code', 'CE'], ['Recreational Drug Use Code', 'CE'],
    ['Admission Level of Care Code', 'CE'], ['Precaution Code', 'CE'], ['Patient Condition Code', 'CE'], 'Living Will Code',
    'Organ Donor Code', ['Advance Directive Code', 'CE'], 'Patient Status Effective Date',
    ['Expected LOA Return Date/Time', 'TS'], ['Expected Pre-admission Testing Date/Time', 'TS'], 'Notify Clergy Code'],
  ORC: ['Order Control', ['Placer Order Number', 'EI'], ['Filler Order Number', 'EI'], ['Placer Group Number', 'EI'],
    'Order Status', 'Response Flag', 'Quantity/Timing', 'Parent', ['Date/Time of Transaction', 'TS'], ['Entered By', 'XCN'],
    ['Verified By', 'XCN'], ['Ordering Provider', 'XCN'], ['Enterer\'s Location', 'PL'], ['Call Back Phone Number', 'XTN'],
    ['Order Effective Date/Time', 'TS'], ['Order Control Code Reason', 'CE'], ['Entering Organization', 'CE'],
    ['Entering Device', 'CE'], ['Action By', 'XCN'], ['Advanced Beneficiary Notice Code', 'CE'],
    ['Ordering Facility Name', 'XON'], ['Ordering Facility Address', 'XAD'], ['Ordering Facility Phone Number', 'XTN'],
    ['Ordering Provider Address', 'XAD'], ['Order Status Modifier', 'CWE'],
    ['Advanced Beneficiary Notice Override Reason', 'CWE'], ['Filler\'s Expected Availability Date/Time', 'TS'],
    ['Confidentiality Code', 'CWE'], ['Order Type', 'CWE'], ['Enterer Authorization Mode', 'CNE'],
    ['Parent Universal Service Identifier', 'CWE']],
  OBR: ['Set ID', ['Placer Order Number', 'EI'], ['Filler Order Number', 'EI'], ['Universal Service Identifier', 'CE'],
    'Priority', 'Requested Date/Time', ['Observation Date/Time', 'TS'], ['Observation End Date/Time', 'TS'],
    'Collection Volume', ['Collector Identifier', 'XCN'], 'Specimen Action Code', ['Danger Code', 'CE'],
    'Relevant Clinical Information', ['Specimen Received Date/Time', 'TS'], 'Specimen Source', ['Ordering Provider', 'XCN'],
    ['Order Callback Phone Number', 'XTN'], 'Placer Field 1', 'Placer Field 2', 'Filler Field 1', 'Filler Field 2',
    ['Results Rpt/Status Chng - Date/Time', 'TS'], 'Charge to Practice', 'Diagnostic Serv Sect ID', 'Result Status',
    'Parent Result', 'Quantity/Timing', ['Result Copies To', 'XCN'], 'Parent', 'Transportation Mode',
    ['Reason for Study', 'CE'], 'Principal Result Interpreter', 'Assistant Result Interpreter', 'Technician',
    'Transcriptionist', ['Scheduled Date/Time', 'TS'], 'Number of Sample Containers',
    ['Transport Logistics of Collected Sample', 'CE'], ['Collector\'s Comment', 'CE'],
    ['Transport Arrangement Responsibility', 'CE'], 'Transport Arranged', 'Escort Required',
    ['Planned Patient Transport Comment', 'CE'], ['Procedure Code', 'CE'], ['Procedure Code Modifier', 'CE'],
    ['Placer Supplemental Service Information', 'CE'], ['Filler Supplemental Service Information', 'CE'],
    ['Medically Necessary Duplicate Procedure Reason', 'CWE'], 'Result Handling',
    ['Parent Universal Service Identifier', 'CWE']],
  OBX: ['Set ID', 'Value Type', ['Observation Identifier', 'CE'], 'Observation Sub-ID', 'Observation Value',
    ['Units', 'CE'], 'References Range', 'Abnormal Flags', 'Probability', 'Nature of Abnormal Test',
    'Observation Result Status', ['Effective Date of Reference Range', 'TS'], 'User Defined Access Checks',
    ['Date/Time of the Observation', 'TS'], ['Producer\'s ID', 'CE'], ['Responsible Observer', 'XCN'],
    ['Observation Method', 'CE'], ['Equipment Instance Identifier', 'EI'], ['Date/Time of the Analysis', 'TS'],
    'Reserved', 'Reserved', 'Reserved', ['Performing Organization Name', 'XON'],
    ['Performing Organization Address', 'XAD'], ['Performing Organization Medical Director', 'XCN']],
  NTE: ['Set ID', 'Source of Comment', 'Comment', ['Comment Type', 'CE']],
  AL1: ['Set ID', ['Allergen Type Code', 'CE'], ['Allergen Code/Mnemonic/Description', 'CE'],
    ['Allergy Severity Code', 'CE'], 'Allergy Reaction Code', 'Identification Date'],
  DG1: ['Set ID', 'Diagnosis Coding Method', ['Diagnosis Code', 'CE'], 'Diagnosis Description',
    ['Diagnosis Date/Time', 'TS'], 'Diagnosis Type', ['Major Diagnostic Category', 'CE'],
    ['Diagnostic Related Group', 'CE'], 'DRG Approval Indicator', 'DRG Grouper Review Code', ['Outlier Type', 'CE'],
    'Outlier Days', 'Outlier Cost', 'Grouper Version and Type', 'Diagnosis Priority', ['Diagnosing Clinician', 'XCN'],
    'Diagnosis Classification', 'Confidential Indicator', ['Attestation Date/Time', 'TS'], ['Diagnosis Identifier', 'EI'],
    'Diagnosis Action Code'],
  SPM: ['Set ID', ['Specimen ID', 'EIP'], 'Specimen Parent IDs', ['Specimen Type', 'CWE'],
    ['Specimen Type Modifier', 'CWE'], ['Specimen Additives', 'CWE'], ['Specimen Collection Method', 'CWE'],
    ['Specimen Source Site', 'CWE'], ['Specimen Source Site Modifier', 'CWE'], ['Specimen Collection Site', 'CWE'],
    ['Specimen Role', 'CWE'], 'Specimen Collection Amount', 'Grouped Specimen Count', 'Specimen Description',
    ['Specimen Handling Code', 'CWE'], ['Specimen Risk Code', 'CWE'], 'Specimen Collection Date/Time',
    ['Specimen Received Date/Time', 'TS'], ['Specimen Expiration Date/Time', 'TS'], 'Specimen Availability',
    ['Specimen Reject Reason', 'CWE'], ['Specimen Quality', 'CWE'], ['Specimen Appropriateness', 'CWE'],
    ['Specimen Condition', 'CWE'], 'Specimen Current Quantity', 'Number of Specimen Containers',
    ['Container Type', 'CWE'], ['Container Condition', 'CWE'], ['Specimen Child Role', 'CWE']],
  MSA: ['Acknowledgment Code', 'Message Control ID', 'Text Message', 'Expected Sequence Number',
    'Delayed Acknowledgment Type', ['Error Condition', 'CE']],
  ERR: ['Error Code and Location', 'Error Location', ['HL7 Error Code', 'CWE'], 'Severity',
    ['Application Error Code', 'CWE'], 'Application Error Parameter', 'Diagnostic Information', 'User Message',
    'Inform Person Indicator', ['Override Type', 'CWE'], ['Override Reason Code', 'CWE'],
    ['Help Desk Contact Point', 'XTN']]
}

const CE = ['Identifier', 'Text', 'Name of Coding System', 'Alternate Identifier', 'Alternate Text',
  'Name of Alternate Coding System']
const CWE = [...CE, 'Coding System Version ID', 'Alternate Coding System Version ID', 'Original Text']

// HL7 v2.5.1 component names per data type
export const HL7_DATATYPE_COMPONENTS = {
  CE, CWE, CNE: CWE,
  HD: ['Namespace ID', 'Universal ID', 'Universal ID Type'],
  TS: ['Time', 'Degree of Precision'],
  MSG: ['Message Code', 'Trigger Event', 'Message Structure'],
  PT: ['Processing ID', 'Processing Mode'],
  VID: ['Version ID', 'Internationalization Code', 'International Version ID'],
  EI: ['Entity Identifier', 'Namespace ID', 'Universal ID', 'Universal ID Type'],
  EIP: ['Placer Assigned Identifier', 'Filler Assigned Identifier'],
  FC: ['Financial Class Code', 'Effective Date'],
  DLD: ['Discharge Location', 'Effective Date'],
  DLN: ['License Number', 'Issuing State, Province, Country', 'Expiration Date'],
  CX: ['ID Number', 'Check Digit', 'Check Digit Scheme', 'Assigning Authority', 'Identifier Type Code',
    'Assigning Facility', 'Effective Date', 'Expiration Date', 'Assigning Jurisdiction', 'Assigning Agency or Department'],
  XPN: ['Family Name', 'Given Name', 'Second and Further Given Names or Initials Thereof', 'Suffix', 'Prefix', 'Degree',
    'Name Type Code', 'Name Representation Code', 'Name Context', 'Name Validity Range', 'Name Assembly Order',
    'Effective Date', 'Expiration Date', 'Professional Suffix'],
  XAD: ['Street Address', 'Other Designation', 'City', 'State or Province', 'Zip or Postal Code', 'Country',
    'Address Type', 'Other Geographic Designation', 'County/Parish Code', 'Census Tract', 'Address Representation Code',
    'Address Validity Range', 'Effective Date', 'Expiration Date'],
  XTN: ['Telephone Number', 'Telecommunication Use Code', 'Telecommunication Equipment Type', 'Email Address',
    'Country Code', 'Area/City Code', 'Local Number', 'Extension', 'Any Text', 'Extension Prefix', 'Speed Dial Code',
    'Unformatted Telephone Number'],
  XCN: ['ID Number', 'Family Name', 'Given Name', 'Second and Further Given Names or Initials Thereof', 'Suffix',
    'Prefix', 'Degree', 'Source Table', 'Assigning Authority', 'Name Type Code', 'Identifier Check Digit',
    'Check Digit Scheme', 'Identifier Type Code', 'Assigning Facility', 'Name Representation Code', 'Name Context',
    'Name Validity Range', 'Name Assembly Order', 'Effective Date', 'Expiration Date', 'Professional Suffix',
    'Assigning Jurisdiction', 'Assigning Agency or Department'],
  PL: ['Point of Care', 'Room', 'Bed', 'Facility', 'Location Status', 'Person Location Type', 'Building', 'Floor',
    'Location Description', 'Comprehensive Location Identifier', 'Assigning Authority for Location'],
  XON: ['Organization Name', 'Organization Name Type Code', 'ID Number', 'Check Digit', 'Check Digit Scheme',
    'Assigning Authority', 'Identifier Type Code', 'Assigning Facility', 'Name Representation Code',
    'Organization Identifier']
}
```

- [ ] **Step 5: Reescribir `parseHL7v2` y borrar `parseHL7Fields`**

En `MessageParser.js`, primera línea:

```js
import { HL7_SEGMENT_FIELDS, HL7_DATATYPE_COMPONENTS } from './hl7v2Definitions.js'
```

Justo después de la clase-imports (fuera de la clase), la constante de segmentos cabecera (MSH-1/MSH-2 son especiales, igual en FHS/BHS de batch):

```js
const HL7_HEADERS = new Set(['MSH', 'FHS', 'BHS'])
```

Reemplazar `parseHL7v2` y **eliminar** `parseHL7Fields` completo:

```js
  parseHL7v2(message) {
    const lines = message.split(/\r\n|\r|\n/).map(l => l.replace(/[\x0b\x1c]/g, '').trim()).filter(Boolean)
    const header = lines.find(l => HL7_HEADERS.has(l.slice(0, 3)))
    if (!header || !lines.some(l => l.startsWith('MSH'))) throw new Error('No MSH segment found')
    const fs = header[3]
    const enc = header.slice(4).split(fs)[0]
    const d = { field: fs, component: enc[0] || '^', repetition: enc[1] || '~', escape: enc[2] || '\\', subcomponent: enc[3] || '&' }

    const counts = {}
    const segments = lines.map(line => {
      const type = line.slice(0, 3)
      const parts = line.split(fs)
      const values = HL7_HEADERS.has(type) ? [fs, ...parts.slice(1)] : parts.slice(1)
      const defs = HL7_SEGMENT_FIELDS[type] || []
      counts[type] = (counts[type] || 0) + 1
      return {
        type,
        index: counts[type],
        name: this.hl7Segments[type] || type,
        raw: line,
        fields: values.map((value, i) => {
          const [name, dataType] = [defs[i]].flat()
          return { name: name || `${type}-${i + 1}`, value, position: i + 1, dataType }
        })
      }
    })

    const msh = segments.find(s => s.type === 'MSH').fields
    const [code = '', event = ''] = (msh[8]?.value || '').split(d.component)
    const version = (msh[11]?.value || '').split(d.component)[0]

    return {
      format: 'hl7v2',
      version,
      formatted: segments.map(s => s.raw).join('\n'),
      analysis: {
        messageType: `${code}${event ? '^' + event : ''} - ${this.hl7MessageTypes[code] || 'Unknown'}`,
        segments: segments.map(seg => ({ name: `${seg.type} - ${seg.name}`, type: seg.type, index: seg.index, fields: seg.fields })),
        segmentCount: segments.length,
        version
      }
    }
  }
```

Borrar también `formatHL7v2` (queda reemplazado por el `map/join` inline).

Nota: los campos sin tipo quedan con `dataType: undefined`; el test de `deepEqual` de Task 1 los compara solo en campos tipados.

- [ ] **Step 6: Correr y ver que pasa**

Run: `npm test -- test/hl7v2.test.js`
Expected: PASS (6 tests)

- [ ] **Step 7: Commit**

```bash
git add package.json src/modules/hl7v2Definitions.js src/modules/MessageParser.js test/hl7v2.test.js
git commit -m "fix(hl7v2): read CR-separated messages and map every field with v2.5.1 names"
```

---

### Task 2: HL7 v2 — árbol completo (repeticiones, componentes, subcomponentes, escapes)

**Files:**
- Modify: `src/modules/MessageParser.js` (`parseHL7v2`; nuevos `fieldTree`, `decodeEscapes`)
- Test: `test/hl7v2.test.js`

**Interfaces:**
- Consumes: `HL7_DATATYPE_COMPONENTS`, `segments[].fields[].dataType` (Task 1).
- Produces: `decodeEscapes(value: string, d): string` y `fieldTree(raw: string, d, label: string, compNames?: string[]): string | object | Array` — reutilizados por ASTM en Task 3. `d` = `{ field, component, repetition, escape, subcomponent? }`.
- Produces: `analysis.detailedStructure` = `{ 'PID - Patient Identification': { 'PID-5 Patient Name': { 'PID-5.1 Family Name': 'DOE', … } }, 'OBX #2 - Observation/Result': {…} }` y `analysis.patientName: string | null`.

- [ ] **Step 1: Escribir los tests que fallan**

Añadir al final de `test/hl7v2.test.js`:

```js
test('components, repetitions and subcomponents are mapped by name', () => {
  const tree = p.parse(ADT.join('\r'), 'hl7v2').analysis.detailedStructure
  const pid = tree['PID - Patient Identification']
  assert.equal(pid['PID-5 Patient Name']['PID-5.1 Family Name'], 'DOE')
  assert.equal(pid['PID-5 Patient Name']['PID-5.2 Given Name'], 'JOHN')
  assert.equal(pid['PID-3 Patient Identifier List'].length, 2)
  assert.equal(pid['PID-3 Patient Identifier List'][1]['PID-3.1 ID Number'], 'M2')
  assert.equal(pid['PID-11 Patient Address']['PID-11.3 City'], 'Springfield')
  assert.equal(tree['PV1 - Patient Visit']['PV1-3 Assigned Patient Location']['PV1-3.2 Room'], '101')
  assert.equal(tree['PV1 - Patient Visit']['PV1-44 Admit Date/Time'], '20240101120000')
  assert.equal(tree['MSH - Message Header']['MSH-2 Encoding Characters'], '^~\\&')
  assert.equal('PID-2 Patient ID' in pid, false) // empty fields are omitted from the tree
})

test('subcomponents split on &', () => {
  const msg = ['MSH|^~\\&|A|B|C|D|20240101||ORU^R01|1|P|2.5.1', 'PID|1||123^^^HOSP&1.2.3&ISO^MR'].join('\r')
  const cx = p.parse(msg, 'hl7v2').analysis.detailedStructure['PID - Patient Identification']['PID-3 Patient Identifier List']
  assert.deepEqual(cx['PID-3.4 Assigning Authority'], { 'PID-3.4.1': 'HOSP', 'PID-3.4.2': '1.2.3', 'PID-3.4.3': 'ISO' })
})

test('repeated segments are kept separately', () => {
  const tree = p.parse(ADT.join('\r'), 'hl7v2').analysis.detailedStructure
  assert.equal(tree['OBX #1 - Observation/Result']['OBX-5 Observation Value'], '95')
  assert.ok(tree['OBX #2 - Observation/Result'])
  assert.ok(tree['PID - Patient Identification']) // single segments carry no #n
})

test('HL7 escape sequences are decoded', () => {
  const tree = p.parse(ADT.join('\r'), 'hl7v2').analysis.detailedStructure
  assert.equal(tree['OBX #2 - Observation/Result']['OBX-5 Observation Value'], 'Line1\nLine2 & more')
})

test('custom encoding characters from MSH-2 are honored', () => {
  const msg = ['MSH|*~\\&|A|B|C|D|20240101||ADT*A08|1|P|2.5', 'PID|1||X1||ROE*JANE'].join('\r')
  const r = p.parse(msg, 'hl7v2')
  assert.equal(r.analysis.detailedStructure['PID - Patient Identification']['PID-5 Patient Name']['PID-5.2 Given Name'], 'JANE')
  assert.equal(r.analysis.messageType, 'ADT^A08 - Admission, discharge, transfer')
})

test('patient name summary comes from PID-5', () => {
  assert.equal(p.parse(ADT.join('\r'), 'hl7v2').analysis.patientName, 'JOHN DOE')
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm test -- test/hl7v2.test.js`
Expected: FAIL — `detailedStructure` undefined.

- [ ] **Step 3: Implementar helpers compartidos**

Añadir en `MessageParser` (debajo de `parseHL7v2`):

```js
  // HL7 (\F\ \S\ \T\ \R\ \E\ \.br\ \Xhh\) and ASTM (&F& &S& &R& &E&) escape sequences
  decodeEscapes(value, d) {
    if (!value.includes(d.escape)) return value
    const e = d.escape.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const map = { F: d.field, S: d.component, T: d.subcomponent, R: d.repetition, E: d.escape }
    return value.replace(new RegExp(`${e}([^${e}]*)${e}`, 'g'), (match, code) =>
      map[code] ?? (code === '.br' ? '\n'
        : /^X([0-9A-Fa-f]{2})+$/.test(code) ? String.fromCharCode(...code.slice(1).match(/../g).map(h => parseInt(h, 16)))
        : match))
  }

  // One field → decoded string, or { 'PID-5.1 Family Name': … } for components, or an array for repetitions
  fieldTree(raw, d, label, compNames = []) {
    const sub = (value, subLabel) => {
      const parts = d.subcomponent ? value.split(d.subcomponent) : [value]
      if (parts.length === 1) return this.decodeEscapes(value, d)
      return Object.fromEntries(parts.map((s, i) => [`${subLabel}.${i + 1}`, this.decodeEscapes(s, d)]).filter(([, v]) => v !== ''))
    }
    const reps = raw.split(d.repetition).map(rep => {
      const comps = rep.split(d.component)
      if (comps.length === 1) return sub(rep, `${label}.1`)
      return Object.fromEntries(comps
        .map((c, i) => [`${label}.${i + 1}${compNames[i] ? ' ' + compNames[i] : ''}`, sub(c, `${label}.${i + 1}`)])
        .filter(([, v]) => v !== ''))
    })
    return reps.length === 1 ? reps[0] : reps
  }
```

- [ ] **Step 4: Construir `detailedStructure` y `patientName` en `parseHL7v2`**

Dentro de `parseHL7v2`, antes del `return`:

```js
    const detailedStructure = Object.fromEntries(segments.map(seg => [
      `${seg.type}${counts[seg.type] > 1 ? ' #' + seg.index : ''} - ${seg.name}`,
      Object.fromEntries(seg.fields.filter(f => f.value !== '').map(f => {
        const label = `${seg.type}-${f.position}`
        const key = f.name === label ? label : `${label} ${f.name}`
        const isEncoding = HL7_HEADERS.has(seg.type) && f.position <= 2
        return [key, isEncoding ? f.value : this.fieldTree(f.value, d, label, HL7_DATATYPE_COMPONENTS[f.dataType])]
      }))
    ]))

    const pidName = segments.find(s => s.type === 'PID')?.fields[4]?.value || ''
    const [family = '', given = ''] = pidName.split(d.repetition)[0].split(d.component).map(v => this.decodeEscapes(v, d))
    const patientName = [given, family].filter(Boolean).join(' ') || null
```

Y en `analysis` añadir `detailedStructure, patientName`.

- [ ] **Step 5: Correr y ver que pasa**

Run: `npm test -- test/hl7v2.test.js`
Expected: PASS (12 tests)

- [ ] **Step 6: Commit**

```bash
git add src/modules/MessageParser.js test/hl7v2.test.js
git commit -m "feat(hl7v2): map repetitions, components, subcomponents and escapes into the analysis tree"
```

---

### Task 3: ASTM — frames E1381, registros sin frame, nombres E1394/LIS2-A2 completos, componentes

**Files:**
- Modify: `src/modules/MessageParser.js` (`parseASTM`, `parseASTMFields`, `detectASTMVersion`, `formatASTM` → reemplazados; nuevo `unframeASTM`)
- Modify: `src/modules/FormatDetector.js` (solo `patterns.astm`)
- Test: `test/astm.test.js`

**Interfaces:**
- Consumes: `fieldTree`, `decodeEscapes` (Task 2).
- Produces: `analysis.records[]` = `{ name, type, sequence, fields: [{ name, value, position }] }` (todos los campos; `position` 1 = Record Type), `analysis.detailedStructure` (`'P #1 - Patient Information': { 'P-6 Patient Name': { 'P-6.1 Last Name': … } }`), `analysis.patientName`, `analysis.recordCount`, `analysis.recordTypes`.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `test/astm.test.js`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MessageParser } from '../src/modules/MessageParser.js'
import { FormatDetector } from '../src/modules/FormatDetector.js'

const p = new MessageParser()
// Same shape SyntheticDataGenerator.generateASTM* produces (no frame numbers)
const RECORDS = [
  'H|\\^&|||LIS^1.0|||||HOST||P|LIS2-A2|20240101120000',
  'P|1|PRAC1|LAB1||DOE^JOHN^Q||19800101|M',
  'O|1|S1||^^^GLU^Glucose|R',
  'R|1|^^^GLU|95|mg/dL|70-110|N||F',
  'C|1|I|Na &F& K|G',
  'L|1|N'
]

test('records without frame numbers are parsed (generator output)', () => {
  const r = p.parse(RECORDS.join('\n'), 'astm')
  assert.equal(r.analysis.recordCount, 6)
  assert.deepEqual(r.analysis.recordTypes, ['H', 'P', 'O', 'R', 'C', 'L'])
})

test('frame-number prefixes and CR separators are accepted', () => {
  const framed = RECORDS.map((l, i) => `${(i + 1) % 8}${l}`).join('\r')
  assert.equal(p.parse(framed, 'astm').analysis.recordCount, 6)
})

test('field names follow E1394 positions (field 1 = record type, 2 = sequence)', () => {
  const [, pRec, , rRec] = p.parse(RECORDS.join('\n'), 'astm').analysis.records
  const at = (rec, n) => rec.fields.find(f => f.position === n)
  assert.deepEqual([at(pRec, 2).name, at(pRec, 2).value], ['Sequence Number', '1'])
  assert.deepEqual([at(pRec, 3).name, at(pRec, 3).value], ['Practice Assigned Patient ID', 'PRAC1'])
  assert.deepEqual([at(pRec, 6).name, at(pRec, 6).value], ['Patient Name', 'DOE^JOHN^Q'])
  assert.deepEqual([at(rRec, 4).name, at(rRec, 4).value], ['Data or Measurement Value', '95'])
  assert.equal(pRec.sequence, '1')
})

test('components and escapes land in the tree', () => {
  const tree = p.parse(RECORDS.join('\n'), 'astm').analysis.detailedStructure
  assert.equal(tree['P #1 - Patient Information']['P-6 Patient Name']['P-6.1 Last Name'], 'DOE')
  assert.equal(tree['R #1 - Result']['R-3 Universal Test ID']['R-3.4 Manufacturer\'s or Local Code'], 'GLU')
  assert.equal(tree['C #1 - Comment']['C-4 Comment Text'], 'Na | K')
  assert.equal(tree['H #1 - Header']['H-2 Delimiter Definition'], '\\^&')
})

test('E1381 frames: STX/ETX/checksum stripped, ETB-split records rejoined', () => {
  const wire = '\x05' +
    '\x021H|\\^&|||LIS\r\x03A1\r\n' +
    '\x022R|1|^^^GLU|9\x17B2\r\n' +
    '\x0235|mg/dL\r\x03C3\r\n' +
    '\x04'
  const r = p.parse(wire, 'astm')
  assert.equal(r.analysis.recordCount, 2)
  const res = r.analysis.detailedStructure['R #1 - Result']
  assert.equal(res['R-4 Data or Measurement Value'], '95')
  assert.equal(res['R-5 Units'], 'mg/dL')
})

test('patient name and version come from P-6 and H-13', () => {
  const r = p.parse(RECORDS.join('\n'), 'astm')
  assert.equal(r.analysis.patientName, 'JOHN DOE')
  assert.equal(r.version, 'LIS2-A2')
})

test('input with no ASTM records is rejected', () => {
  assert.throws(() => p.parse('hello world', 'astm'), /No ASTM records/)
})

test('detector recognizes unframed ASTM', () => {
  assert.equal(new FormatDetector().detectFormat(RECORDS.join('\n')).format, 'astm')
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm test -- test/astm.test.js`
Expected: FAIL — `recordCount` 0, nombres desplazados, detector devuelve `null`.

- [ ] **Step 3: Reemplazar `astmRecordTypes` y añadir tablas de campos**

En el constructor, reemplazar `this.astmRecordTypes` por (nombres cortos, se usan en las claves del árbol):

```js
    this.astmRecordTypes = {
      H: 'Header', P: 'Patient Information', O: 'Test Order', R: 'Result', C: 'Comment',
      Q: 'Request Information', M: 'Manufacturer Information', S: 'Scientific', L: 'Terminator'
    }

    // ASTM E1394 / CLSI LIS2-A2 field names; position 1 is the record type
    this.astmFields = {
      H: ['Record Type ID', 'Delimiter Definition', 'Message Control ID', 'Access Password', 'Sender Name or ID',
        'Sender Street Address', 'Reserved Field', 'Sender Telephone Number', 'Characteristics of Sender', 'Receiver ID',
        'Comment or Special Instructions', 'Processing ID', 'Version Number', 'Date and Time of Message'],
      P: ['Record Type ID', 'Sequence Number', 'Practice Assigned Patient ID', 'Laboratory Assigned Patient ID',
        'Patient ID No. 3', 'Patient Name', 'Mother\'s Maiden Name', 'Birthdate', 'Patient Sex',
        'Patient Race-Ethnic Origin', 'Patient Address', 'Reserved Field', 'Patient Telephone Number',
        'Attending Physician ID', 'Special Field 1', 'Special Field 2', 'Patient Height', 'Patient Weight',
        'Patient\'s Known or Suspected Diagnosis', 'Patient Active Medications', 'Patient\'s Diet', 'Practice Field No. 1',
        'Practice Field No. 2', 'Admission and Discharge Dates', 'Admission Status', 'Location',
        'Nature of Alternative Diagnostic Code and Classifiers', 'Alternative Diagnostic Code and Classification',
        'Patient Religion', 'Marital Status', 'Isolation Status', 'Language', 'Hospital Service', 'Hospital Institution',
        'Dosage Category'],
      O: ['Record Type ID', 'Sequence Number', 'Specimen ID', 'Instrument Specimen ID', 'Universal Test ID', 'Priority',
        'Requested/Ordered Date and Time', 'Specimen Collection Date and Time', 'Collection End Time',
        'Collection Volume', 'Collector ID', 'Action Code', 'Danger Code', 'Relevant Clinical Information',
        'Date/Time Specimen Received', 'Specimen Descriptor', 'Ordering Physician', 'Physician\'s Telephone Number',
        'User Field No. 1', 'User Field No. 2', 'Laboratory Field No. 1', 'Laboratory Field No. 2',
        'Date/Time Results Reported or Last Modified', 'Instrument Charge to Information System',
        'Instrument Section ID', 'Report Types', 'Reserved Field', 'Location of Specimen Collection',
        'Nosocomial Infection Flag', 'Specimen Service', 'Specimen Institution'],
      R: ['Record Type ID', 'Sequence Number', 'Universal Test ID', 'Data or Measurement Value', 'Units',
        'Reference Ranges', 'Result Abnormal Flags', 'Nature of Abnormality Testing', 'Result Status',
        'Date of Change in Instrument Normative Values', 'Operator Identification', 'Date/Time Test Started',
        'Date/Time Test Completed', 'Instrument Identification'],
      C: ['Record Type ID', 'Sequence Number', 'Comment Source', 'Comment Text', 'Comment Type'],
      Q: ['Record Type ID', 'Sequence Number', 'Starting Range ID Number', 'Ending Range ID Number', 'Universal Test ID',
        'Nature of Request Time Limits', 'Beginning Request Results Date and Time', 'Ending Request Results Date and Time',
        'Requesting Physician Name', 'Requesting Physician Telephone Number', 'User Field No. 1', 'User Field No. 2',
        'Request Information Status Codes'],
      M: ['Record Type ID', 'Sequence Number'],
      S: ['Record Type ID', 'Sequence Number'],
      L: ['Record Type ID', 'Sequence Number', 'Termination Code']
    }
    this.astmComponents = {
      'Universal Test ID': ['Universal Test ID Number', 'Universal Test ID Name', 'Universal Test ID Type',
        'Manufacturer\'s or Local Code'],
      'Patient Name': ['Last Name', 'First Name', 'Middle Name', 'Suffix', 'Title'],
      'Mother\'s Maiden Name': ['Last Name', 'First Name', 'Middle Name', 'Suffix', 'Title']
    }
```

- [ ] **Step 4: Reemplazar `parseASTM`; borrar `parseASTMFields`, `detectASTMVersion`, `formatASTM`**

```js
  // ponytail: E1381 link-layer is only unwrapped (STX/FN/ETB/ETX/checksum); checksums are not verified
  unframeASTM(message) {
    if (message.includes('\x02')) {
      let text = ''
      for (const [, body, end] of message.matchAll(/\x02[0-7]([\s\S]*?)([\x03\x17])[0-9A-Fa-f]{2}/g)) {
        text += body + (end === '\x03' ? '\r' : '')
      }
      message = text
    }
    return message.split(/\r\n|\r|\n/)
      .map(l => l.replace(/[\x04\x05\x06\x15]/g, '').trim().replace(/^\d+(?=[A-Z][^A-Za-z0-9\s])/, ''))
      .filter(l => /^[A-Z][^A-Za-z0-9\s]/.test(l))
  }

  parseASTM(message) {
    const lines = this.unframeASTM(message)
    const header = lines.find(l => l[0] === 'H')
    const fs = header?.[1] || '|'
    const delims = header ? header.slice(2).split(fs)[0] : ''
    const d = { field: fs, repetition: delims[0] || '\\', component: delims[1] || '^', escape: delims[2] || '&' }

    const counts = {}
    const records = lines.filter(l => l[1] === fs).map(line => {
      const type = line[0]
      const defs = this.astmFields[type] || []
      counts[type] = (counts[type] || 0) + 1
      const fields = line.split(fs).map((value, i) => ({ name: defs[i] || `${type}-${i + 1}`, value, position: i + 1 }))
      return { type, index: counts[type], sequence: fields[1]?.value || '', name: this.astmRecordTypes[type] || type, fields, raw: line }
    })
    if (!records.length) throw new Error('No ASTM records found')

    const detailedStructure = Object.fromEntries(records.map(rec => [
      `${rec.type} #${rec.index} - ${rec.name}`,
      Object.fromEntries(rec.fields.filter(f => f.value !== '').map(f => {
        const label = `${rec.type}-${f.position}`
        const key = f.name === label ? label : `${label} ${f.name}`
        const isDelims = rec.type === 'H' && f.position === 2
        return [key, isDelims ? f.value : this.fieldTree(f.value, d, label, this.astmComponents[f.name])]
      }))
    ]))

    const pName = records.find(r => r.type === 'P')?.fields[5]?.value || ''
    const [last = '', first = ''] = pName.split(d.repetition)[0].split(d.component).map(v => this.decodeEscapes(v, d))
    const hFields = records.find(r => r.type === 'H')?.fields || []

    return {
      format: 'astm',
      version: hFields[12]?.value || message.match(/LIS2-A2|E1394|E1381|E1238/)?.[0] || null,
      formatted: records.map(r => r.raw).join('\n'),
      analysis: {
        recordTypes: [...new Set(records.map(r => r.type))],
        recordCount: records.length,
        records: records.map(r => ({ name: `${r.type} - ${r.name}`, type: r.type, sequence: r.sequence, fields: r.fields })),
        patientName: [first, last].filter(Boolean).join(' ') || null,
        detailedStructure
      }
    }
  }
```

- [ ] **Step 5: Detector de ASTM**

En `FormatDetector.js`, reemplazar el array `astm` de `this.patterns` por (frame opcional, cualquier tipo de registro inicial; los patrones de texto literal `\\x02`/`STX` se eliminan porque el parser no los interpreta):

```js
      astm: [
        /^\x05?\x02?\d?[HPORL]\|/
      ],
```

- [ ] **Step 6: Correr y ver que pasa**

Run: `npm test -- test/astm.test.js`
Expected: PASS (8 tests)

- [ ] **Step 7: Commit**

```bash
git add src/modules/MessageParser.js src/modules/FormatDetector.js test/astm.test.js
git commit -m "fix(astm): parse unframed and E1381-framed records with full LIS2-A2 field mapping"
```

---

### Task 4: Motor XML sin DOM (fast-xml-parser) + HL7 v3 / C-CDA completo

**Files:**
- Modify: `src/modules/MessageParser.js` (`parseHL7v3`, `parseXML`, `formatXML`, `analyzeXMLStructure`, `extractXMLNamespaces`; borrar `xmlToObject`, `analyzeHL7v3Structure`, `extractXMLVersion` se mantiene)
- Test: `test/hl7v3.test.js`

**Interfaces:**
- Produces: `parseXmlDocument(message): { rootName: string, root: object }`. Forma del objeto: atributos en `'@attributes'`, texto en `'#text'`, elementos repetidos como array, un solo elemento como objeto. Es la misma forma que producía `xmlToObject`, así que el árbol C-CDA de la UI sigue funcionando.
- Produces: `analysis` de hl7v3 = `{ documentType, templateId, code, patientName, sectionCount, detailedStructure, elementCount }`.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `test/hl7v3.test.js`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MessageParser } from '../src/modules/MessageParser.js'

const p = new MessageParser()
const CCD = `<?xml version="1.0"?>
<ClinicalDocument xmlns="urn:hl7-org:v3">
  <templateId root="2.16.840.1.113883.10.20.22.1.1"/>
  <code code="34133-9" codeSystem="2.16.840.1.113883.6.1"/>
  <title>Summary of Care</title>
  <recordTarget><patientRole><id extension="123" root="1.2.3"/>
    <patient><name><given>Jane</given><given>Q</given><family>Roe</family></name></patient>
  </patientRole></recordTarget>
  <component><structuredBody>
    <component><section><title>Allergies</title><text>No known <content>allergies</content></text>
      <entry><act><entryRelationship><observation><entryRelationship><observation>
        <value code="X"/>
      </observation></entryRelationship></observation></entryRelationship></act></entry>
    </section></component>
    <component><section><title>Medications</title></section></component>
  </structuredBody></component>
</ClinicalDocument>`

test('C-CDA header, patient and section count are extracted', () => {
  const r = p.parse(CCD, 'hl7v3')
  assert.equal(r.version, 'C-CDA')
  assert.equal(r.analysis.documentType, 'Summary of Care')
  assert.equal(r.analysis.templateId, '2.16.840.1.113883.10.20.22.1.1')
  assert.equal(r.analysis.code, '34133-9')
  assert.equal(r.analysis.patientName, 'Jane Q Roe')
  assert.equal(r.analysis.sectionCount, 2)
})

test('the tree reaches the deepest entry and keeps mixed narrative text and <name>', () => {
  const t = p.parse(CCD, 'hl7v3').analysis.detailedStructure
  const section = t.component.structuredBody.component[0].section
  assert.equal(section.entry.act.entryRelationship.observation.entryRelationship.observation.value['@attributes'].code, 'X')
  assert.match(section.text['#text'], /No known/)
  assert.equal(t.recordTarget.patientRole.patient.name.family['#text'], 'Roe')
})

test('V3 messaging (non-CDA) is labelled by its interaction id', () => {
  const r = p.parse('<PRPA_IN201305UV02 xmlns="urn:hl7-org:v3" ITSVersion="XML_1.0"><id root="1"/></PRPA_IN201305UV02>', 'hl7v3')
  assert.equal(r.version, 'V3 Messaging')
  assert.equal(r.analysis.documentType, 'PRPA_IN201305UV02')
})

test('malformed XML is rejected with a location', () => {
  assert.throws(() => p.parse('<ClinicalDocument><title></ClinicalDocument>', 'hl7v3'), /Invalid XML.*line 1/)
})

test('generic XML keeps namespaces and counts elements', () => {
  const r = p.parse('<?xml version="1.0"?><root xmlns:a="urn:a"><a:item id="1">x</a:item><a:item id="2"/></root>', 'xml')
  assert.equal(r.version, '1.0')
  assert.deepEqual(r.analysis.namespaces, ['xmlns:a="urn:a"'])
  assert.equal(r.analysis.elementCount, 3)
  assert.equal(r.analysis.detailedStructure['a:item'].length, 2)
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm test -- test/hl7v3.test.js`
Expected: FAIL — `DOMParser is not defined`.

- [ ] **Step 3: Implementar `parseXmlDocument` y reescribir `parseHL7v3`/`parseXML`**

Import al inicio de `MessageParser.js`:

```js
import { XMLParser, XMLValidator } from 'fast-xml-parser'
```

Debajo de `HL7_HEADERS`:

```js
const MAX_INPUT = 10 * 1024 * 1024 // 10MB: DoS guard for XML/JSON
const xmlParser = new XMLParser({
  ignoreAttributes: false, attributesGroupName: '@attributes', attributeNamePrefix: '',
  textNodeName: '#text', alwaysCreateTextNode: true, parseTagValue: false, parseAttributeValue: false
})
const xmlText = n => (typeof n === 'object' ? n?.['#text'] : n) ?? ''
```

Métodos (reemplazan `parseHL7v3`, `parseXML`, `formatXML`, `analyzeXMLStructure`, `extractXMLNamespaces`; borrar `xmlToObject` y `analyzeHL7v3Structure`):

```js
  parseXmlDocument(message) {
    if (message.length > MAX_INPUT) throw new Error('Message too large (max 10MB)')
    const valid = XMLValidator.validate(message)
    if (valid !== true) throw new Error(`Invalid XML: ${valid.err.msg} (line ${valid.err.line})`)
    const doc = xmlParser.parse(message)
    const rootName = Object.keys(doc).find(k => !k.startsWith('?'))
    return { rootName, root: doc[rootName] }
  }

  parseHL7v3(message) {
    const { rootName, root } = this.parseXmlDocument(message)
    const attr = (node, a) => [node].flat()[0]?.['@attributes']?.[a]
    const templateIds = [root.templateId].flat().map(t => attr(t, 'root')).filter(Boolean)
    const isCda = rootName.endsWith('ClinicalDocument')
    // ponytail: paths assume the default CDA namespace (no "cda:" prefixes); prefixed docs still parse, only the summary is empty
    const name = [[root.recordTarget].flat()[0]?.patientRole?.patient?.name].flat()[0]
    return {
      format: 'hl7v3',
      version: !isCda ? 'V3 Messaging' : templateIds.some(t => t.startsWith('2.16.840.1.113883.10.20.22')) ? 'C-CDA' : 'CDA R2',
      formatted: this.formatXML(message),
      analysis: {
        documentType: xmlText(root.title) || rootName,
        templateId: templateIds.join(', '),
        code: attr(root.code, 'code') || '',
        patientName: name ? [...[name.given].flat().map(xmlText), xmlText(name.family)].filter(Boolean).join(' ') : null,
        sectionCount: [root.component?.structuredBody?.component].flat().filter(Boolean).length,
        detailedStructure: root,
        elementCount: this.countXmlElements(message)
      }
    }
  }

  parseXML(message) {
    const { rootName, root } = this.parseXmlDocument(message)
    return {
      format: 'xml',
      version: this.extractXMLVersion(message),
      formatted: this.formatXML(message),
      analysis: {
        rootElement: rootName,
        structure: this.analyzeXMLStructure(root),
        detailedStructure: root,
        elementCount: this.countXmlElements(message),
        namespaces: Object.entries(root['@attributes'] || {}).filter(([k]) => k.startsWith('xmlns')).map(([k, v]) => `${k}="${v}"`)
      }
    }
  }

  analyzeXMLStructure(node) {
    return Object.entries(node).filter(([k]) => k !== '@attributes' && k !== '#text').flatMap(([name, value]) =>
      [value].flat().map(child => ({
        name,
        attributes: Object.entries(child['@attributes'] || {}).map(([a, v]) => `${a}="${v}"`),
        hasChildren: Object.keys(child).some(k => k !== '@attributes' && k !== '#text'),
        textContent: xmlText(child).slice(0, 100)
      })))
  }

  // ponytail: counts start tags with a regex; "<x" inside CDATA or comments is miscounted
  countXmlElements(message) {
    return (message.match(/<[A-Za-z_]/g) || []).length
  }

  formatXML(xml) {
    return xml.replace(/>\s*</g, '>\n<').trim()
  }
```

(La cuenta del test "generic XML" = `root` + 2 `a:item` = 3.)

- [ ] **Step 4: Correr y ver que pasa**

Run: `npm test -- test/hl7v3.test.js`
Expected: PASS (5 tests). Luego `npm test` completo: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/MessageParser.js test/hl7v3.test.js
git commit -m "feat(hl7v3): parse XML with fast-xml-parser, keep full C-CDA tree and mixed narrative"
```

---

### Task 5: FHIR — JSON y XML con el mismo modelo, datos de Bundle y paciente

**Files:**
- Modify: `src/modules/MessageParser.js` (`parseFHIR`; nuevos `fhirXmlToJson`, `fhirPatient`; borrar `analyzeFHIRStructure`, `formatFHIRValue`)
- Test: `test/fhir.test.js`

**Interfaces:**
- Consumes: `parseXmlDocument`, `xmlText` (Task 4).
- Produces: `analysis` de FHIR = `{ resourceType, description, detailedStructure (JSON FHIR, también para entrada XML), fieldCount, patientName, bundleType?, entryCount?, resourceCounts? }`. `detailedStructure.entry` siempre es array para Bundles.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `test/fhir.test.js`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MessageParser } from '../src/modules/MessageParser.js'

const p = new MessageParser()
const BUNDLE = JSON.stringify({
  resourceType: 'Bundle', type: 'collection',
  entry: [
    { fullUrl: 'urn:uuid:1', resource: { resourceType: 'Patient', id: '1', name: [{ given: ['John'], family: 'Doe' }] } },
    { resource: { resourceType: 'Observation', id: 'o1', subject: { reference: 'Patient/1' }, valueQuantity: { value: 95, unit: 'mg/dL' } } },
    { resource: { resourceType: 'Observation', id: 'o2', subject: { reference: 'Patient/1' } } }
  ]
})

test('Bundle summary data: type, entry count, resource counts, patient', () => {
  const a = p.parse(BUNDLE, 'fhir').analysis
  assert.equal(a.bundleType, 'collection')
  assert.equal(a.entryCount, 3)
  assert.deepEqual(a.resourceCounts, { Patient: 1, Observation: 2 })
  assert.equal(a.patientName, 'John Doe')
  assert.equal(a.detailedStructure.entry[1].resource.valueQuantity.unit, 'mg/dL')
})

test('non-Patient resources report their subject', () => {
  const obs = JSON.stringify({ resourceType: 'Observation', subject: { reference: 'Patient/1' } })
  assert.equal(p.parse(obs, 'fhir').analysis.patientName, 'Patient/1')
})

test('FHIR XML is converted to the JSON model', () => {
  const xml = '<Patient xmlns="http://hl7.org/fhir"><id value="p1"/><name><family value="Doe"/><given value="John"/></name><gender value="male"/></Patient>'
  const a = p.parse(xml, 'fhir').analysis
  assert.equal(a.resourceType, 'Patient')
  assert.equal(a.detailedStructure.id, 'p1')
  assert.equal(a.detailedStructure.gender, 'male')
  assert.equal(a.patientName, 'John Doe')
})

test('FHIR XML Bundle: resource wrappers become resourceType, entry is always an array', () => {
  const xml = '<Bundle xmlns="http://hl7.org/fhir"><type value="collection"/><entry><resource><Patient><id value="p1"/></Patient></resource></entry></Bundle>'
  const a = p.parse(xml, 'fhir').analysis
  assert.equal(a.entryCount, 1)
  assert.equal(a.detailedStructure.entry[0].resource.resourceType, 'Patient')
  assert.deepEqual(a.resourceCounts, { Patient: 1 })
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm test -- test/fhir.test.js`
Expected: FAIL — `DOMParser is not defined` / `bundleType` undefined.

- [ ] **Step 3: Reescribir `parseFHIR` y añadir helpers**

```js
  parseFHIR(message) {
    if (message.length > MAX_INPUT) throw new Error('Message too large (max 10MB)')
    const isXML = message.trim().startsWith('<')
    let resource
    if (isXML) {
      const { rootName, root } = this.parseXmlDocument(message)
      resource = { resourceType: rootName, ...this.fhirXmlToJson(root) }
    } else {
      resource = JSON.parse(message)
    }
    const resourceType = resource.resourceType || 'Unknown'
    const analysis = {
      resourceType,
      description: this.fhirResourceTypes[resourceType] || 'Unknown resource type',
      detailedStructure: resource,
      fieldCount: Object.keys(resource).length,
      patientName: this.fhirPatient(resource)
    }
    if (resourceType === 'Bundle') {
      const entries = [resource.entry].flat().filter(Boolean)
      resource.entry = entries
      analysis.bundleType = resource.type || null
      analysis.entryCount = entries.length
      analysis.resourceCounts = {}
      for (const e of entries) {
        const t = e.resource?.resourceType || 'Unknown'
        analysis.resourceCounts[t] = (analysis.resourceCounts[t] || 0) + 1
      }
      analysis.patientName = this.fhirPatient(entries.find(e => e.resource?.resourceType === 'Patient')?.resource || {})
    }
    return {
      format: 'fhir',
      version: this.extractFHIRVersion(message),
      formatted: isXML ? this.formatXML(message) : JSON.stringify(resource, null, 2),
      analysis
    }
  }

  // ponytail: no StructureDefinition cardinality, so an XML element that occurs once stays an object (JSON would use an array)
  fhirXmlToJson(node) {
    if (Array.isArray(node)) return node.map(n => this.fhirXmlToJson(n))
    if (typeof node !== 'object' || node === null) return node
    const { '@attributes': { xmlns, value, ...attrs } = {}, '#text': text, ...children } = node
    const kids = Object.fromEntries(Object.entries(children).map(([k, v]) => {
      const converted = this.fhirXmlToJson(v)
      // <resource><Patient>…</Patient></resource> → resource: { resourceType: 'Patient', … }
      if ((k === 'resource' || k === 'contained') && !Array.isArray(v) && Object.keys(children[k]).length === 1) {
        const [type] = Object.keys(v)
        return [k, { resourceType: type, ...converted[type] }]
      }
      return [k, converted]
    }))
    if (value !== undefined && !Object.keys(kids).length && !Object.keys(attrs).length) return value
    return { ...attrs, ...(value !== undefined && { value }), ...kids, ...(text && { '#text': text }) }
  }

  fhirPatient(r) {
    if (r.resourceType === 'Patient') {
      const n = [r.name].flat()[0]
      return n ? (n.text || [...[n.given].flat(), n.family].filter(Boolean).join(' ')) || null : null
    }
    return r.subject?.display || r.subject?.reference || r.patient?.display || r.patient?.reference || null
  }
```

Borrar `analyzeFHIRStructure` y `formatFHIRValue` (el resumen ya no los usa tras Task 7; `structure` de FHIR solo alimentaba el resumen roto).

- [ ] **Step 4: Correr y ver que pasa**

Run: `npm test`
Expected: PASS (todos los archivos)

- [ ] **Step 5: Commit**

```bash
git add src/modules/MessageParser.js test/fhir.test.js
git commit -m "feat(fhir): unify JSON/XML models and expose bundle and patient summary data"
```

---

### Task 6: FormatDetector — patrones correctos y sin código muerto

**Files:**
- Modify: `src/modules/FormatDetector.js`
- Test: `test/detector.test.js`

**Interfaces:**
- Produces: `detectFormat(message): { format, version } | null` (se elimina `confidence`: nadie lo lee — verificado con grep en `main.js`/`UIController.js`).

- [ ] **Step 1: Escribir los tests que fallan**

Crear `test/detector.test.js`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FormatDetector } from '../src/modules/FormatDetector.js'

const d = new FormatDetector()
const detect = m => d.detectFormat(m)

test('HL7 v2 with 2.5.1 reports the full MSH-12 version', () => {
  assert.deepEqual(detect('MSH|^~\\&|A|B|C|D|20240101||ORU^R01|1|P|2.5.1\rPID|1'), { format: 'hl7v2', version: '2.5.1' })
})

test('HL7 v2 batch (FHS/BHS first) is still HL7 v2', () => {
  assert.equal(detect('FHS|^~\\&|A\rBHS|^~\\&|A\rMSH|^~\\&|A|B|C|D|1||ADT^A01|1|P|2.5').format, 'hl7v2')
})

test('any FHIR XML resource is FHIR, not generic XML', () => {
  assert.equal(detect('<Observation xmlns="http://hl7.org/fhir"><status value="final"/></Observation>').format, 'fhir')
})

test('FHIR JSON that mentions C-CDA stays FHIR', () => {
  assert.equal(detect('{"resourceType":"Composition","title":"Converted from C-CDA"}').format, 'fhir')
})

test('CDA and V3 messages are hl7v3', () => {
  assert.equal(detect('<ClinicalDocument xmlns="urn:hl7-org:v3"><title>x</title></ClinicalDocument>').format, 'hl7v3')
  assert.equal(detect('<PRPA_IN201305UV02 xmlns="urn:hl7-org:v3"/>').format, 'hl7v3')
})

test('plain JSON and XML fall through', () => {
  assert.equal(detect('{"a":1}').format, 'json')
  assert.equal(detect('<?xml version="1.0"?><a/>').format, 'xml')
  assert.equal(detect('just text'), null)
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm test -- test/detector.test.js`
Expected: FAIL — versión `null`, Observation XML → `xml`, Composition → `hl7v3`, batch → `null`.

- [ ] **Step 3: Reemplazar `FormatDetector.js` completo**

```js
export class FormatDetector {
  constructor() {
    // Order matters: the first matching format wins
    this.patterns = {
      hl7v2: [/(^|[\r\n])MSH\|/],
      fhir: [/"resourceType"\s*:\s*"[A-Z][A-Za-z]+"/, /<\w+[^>]*xmlns="http:\/\/hl7\.org\/fhir"/],
      hl7v3: [/<(\w+:)?ClinicalDocument[\s>]/, /xmlns(:\w+)?="urn:hl7-org:v3"/],
      astm: [/^\x05?\x02?\d?[HPORL]\|/],
      json: [/^\s*[{[]/],
      xml: [/^\s*<[^>]+>/]
    }

    this.versionPatterns = {
      hl7v2: [{ pattern: /(?:^|[\r\n])MSH\|(?:[^|]*\|){10}([^|^\r\n]+)/ }],
      hl7v3: [
        { pattern: /templateId[^>]*2\.16\.840\.1\.113883\.10\.20\.22\.1\.1\b/i, version: 'C-CDA R2.1 CCD' },
        { pattern: /templateId[^>]*2\.16\.840\.1\.113883\.10\.20\.22\.1\.4\b/i, version: 'C-CDA R2.1 Consultation Note' },
        { pattern: /templateId[^>]*2\.16\.840\.1\.113883\.10\.20\.22/i, version: 'C-CDA R2.1' },
        { pattern: /<(\w+:)?ClinicalDocument[\s>]/, version: 'CDA R2' }
      ],
      fhir: [
        { pattern: /"fhirVersion"\s*:\s*"([^"]+)"/i },
        { pattern: /xmlns="http:\/\/hl7\.org\/fhir"/, version: 'FHIR' }
      ],
      astm: [{ pattern: /LIS2-A2|E1394|E1381|E1238/ }]
    }
  }

  detectFormat(message) {
    if (!message || typeof message !== 'string') return null
    const text = message.trim()
    for (const [format, patterns] of Object.entries(this.patterns)) {
      if (patterns.some(p => p.test(text))) return { format, version: this.detectVersion(text, format) }
    }
    return null
  }

  detectVersion(message, format) {
    for (const { pattern, version } of this.versionPatterns[format] || []) {
      const match = message.match(pattern)
      if (match) return match[1] ?? version ?? match[0]
    }
    return null
  }
}
```

Nota: FHIR va antes que hl7v3 a propósito (un JSON FHIR con texto "C-CDA" ya no se confunde). Un CDA no contiene `"resourceType":` ni `xmlns="http://hl7.org/fhir"`, así que no se desvía. El `2.16.840.1.113883.10.20.22.1.2` original decía "Consultation" pero ese OID es History & Physical; se corrige a `.1.4` (Consultation Note).

- [ ] **Step 4: Correr y ver que pasa**

Run: `npm test`
Expected: PASS (todos)

- [ ] **Step 5: Commit**

```bash
git add src/modules/FormatDetector.js test/detector.test.js
git commit -m "fix(detector): detect FHIR XML, V3 messaging, HL7 batches and 2.5.1; drop dead fallback and unused confidence"
```

---

### Task 7: UI — mostrar todos los niveles sin cambiar el diseño

**Files:**
- Modify: `src/modules/UIController.js`

**Interfaces:**
- Consumes: `analysis.detailedStructure`, `analysis.patientName`, `analysis.sectionCount`, `analysis.bundleType`, `analysis.entryCount`, `analysis.resourceCounts`, `analysis.recordCount` (Tasks 2–5).

La UI no tiene tests automáticos (depende del DOM); la verificación es en navegador (Step 9).

- [ ] **Step 1: Límites de profundidad/cantidad y aviso de truncado**

En el constructor:

```js
    this.maxItems = 5000
    this.maxDepth = 40
```

En `displayAnalysis`, justo antes de `// Update count badge`:

```js
    if (this.itemCount >= this.maxItems) {
      const note = document.createElement('div')
      note.className = 'analysis-item text-xs text-gray-500'
      note.textContent = `Showing the first ${this.maxItems} items. The Formatted tab has the complete message.`
      analysisContent.appendChild(note)
    }
```

(Clases ya existentes en el proyecto — no hay estilo nuevo.)

- [ ] **Step 2: `processDeepTreeItem` sin cortes ni filtros**

Dentro de `processDeepTreeItem`:
- `if (depth > 10 || …)` → `if (depth > this.maxDepth || this.itemCount >= this.maxItems) {`
- `children: item.slice(0, 50).map(` → `children: item.map(`
- Borrar el bloque completo `if (item.fields && Array.isArray(item.fields)) { … }` y dejar solo el cuerpo del `else` (ninguna `detailedStructure` tiene forma `{fields}`).
- En el filtro de `entries`: borrar la línea `if (key === 'name') return false` (ocultaba `Patient.name` y `<name>` de C-CDA) y borrar `.slice(0, 100)`.
- `this.getContextualFriendlyName(parentKey || item.name)` → `this.getContextualFriendlyName(parentKey)` (bug #14: `item.name` puede ser un array FHIR).

- [ ] **Step 3: Filtro técnico mínimo, valores más largos, nombres legibles**

```js
  shouldSkipTechnicalField(fieldName) {
    return /^(xmlns|xsi:|schemaLocation)/.test(fieldName)
  }
```

En `formatClinicalValue`: `if (str.length > 100)` / `substring(0, 100)` → `500` (igual que `formatValue`).

En `getFriendlyName`, última línea:

```js
    return friendlyNames[name] || name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, str => str.toUpperCase())
```

- [ ] **Step 4: Raíz del árbol para HL7 v2 / ASTM**

En `createSimplifiedTreeData`, rama `else if (typeof data === 'object' && data !== null)`:

```js
      return this.processDeepTreeItem(data, null, 0, `${format.toUpperCase()} Message`)
```

Y en la rama `Array.isArray(data)`, quitar `.filter(item => !this.shouldSkipTechnicalItem(item))`.

- [ ] **Step 5: Árbol FHIR sobre el JSON real**

Reemplazar `createFHIRTreeStructure`:

```js
  createFHIRTreeStructure(data) {
    const label = r => `${r?.resourceType || 'Resource'}${r?.id ? '/' + r.id : ''}`
    if (data.resourceType !== 'Bundle') return this.processDeepTreeItem(data, null, 0, `${label(data)} (FHIR)`)
    const { entry = [], ...meta } = data
    return {
      key: 'Bundle (FHIR)',
      type: 'bundle',
      value: `${data.type || 'collection'} - ${entry.length} entries`,
      children: [
        this.processDeepTreeItem(meta, null, 1, 'Bundle Metadata'),
        ...entry.map((e, i) => this.processDeepTreeItem(e, i, 1, `${i + 1}. ${label(e.resource)}`))
      ]
    }
  }
```

- [ ] **Step 6: Resúmenes clínicos desde `analysis`**

Primero el XSS (bug #13). En `displayClinicalSummary`:

```js
      <p class="text-blue-700 dark:text-blue-300">${this.escapeHtml(summaryText)}</p>
```

Reemplazar `generateCCDASummary`, `generateFHIRSummary`, `generateHL7v2Summary` y añadir `generateASTMSummary` + su `case`:

```js
      case 'astm':
        return this.generateASTMSummary(analysis)
```

```js
  generateCCDASummary(analysis) {
    let summary = `Patient: ${analysis.patientName || 'Not specified'}, Document: ${analysis.documentType || 'Clinical Document'}`
    if (analysis.sectionCount) summary += `, ${analysis.sectionCount} clinical sections`
    return summary
  }

  generateFHIRSummary(analysis) {
    const patient = analysis.patientName ? `, Patient: ${analysis.patientName}` : ''
    if (analysis.resourceType !== 'Bundle') return `Resource: ${analysis.resourceType || 'FHIR Resource'}${patient}`
    const counts = Object.entries(analysis.resourceCounts || {}).map(([t, n]) => `${n} ${t}${n > 1 ? 's' : ''}`).join(', ')
    return `Bundle: ${analysis.bundleType || 'collection'} with ${analysis.entryCount || 0} entries (${counts || 'no resources'})${patient}`
  }

  generateHL7v2Summary(analysis) {
    let summary = `Message: ${analysis.messageType || 'HL7 Message'}`
    if (analysis.patientName) summary += `, Patient: ${analysis.patientName}`
    if (analysis.segmentCount) summary += `, ${analysis.segmentCount} segments`
    return summary
  }

  generateASTMSummary(analysis) {
    let summary = `ASTM: ${analysis.recordCount} records`
    if (analysis.patientName) summary += `, Patient: ${analysis.patientName}`
    return summary
  }
```

- [ ] **Step 7: `addSimplifiedAnalysisSection` muestra todos los campos**

Borrar `if (this.shouldSkipTechnicalItem(item)) continue` y reemplazar:

```js
        const relevantFields = item.fields.filter(field => this.isClinicallyRelevant(field))
        for (const field of relevantFields.slice(0, 5)) {
```

por:

```js
        for (const field of item.fields) {
```

- [ ] **Step 8: Build + tests**

Run: `npm test && npm run build`
Expected: tests PASS; build sin errores.

- [ ] **Step 9: Verificación en navegador**

Run: `npm run dev` y abrir la URL. Para cada caso, pegar, Auto-detect, Parse:
1. Generator → HL7 v2 ADT → "Use generated": el árbol muestra `PV1-44 Admit Date/Time` y `PID-5 Patient Name ▸ PID-5.1 Family Name`; el resumen dice `Patient: <nombre>`.
2. Generator → ASTM: se detecta ASTM, `recordCount` > 0, `R #1 - Result ▸ R-4 Data or Measurement Value`.
3. Generator → FHIR Bundle: resumen con conteo por tipo; cada entry desplegable hasta `name`.
4. Generator → C-CDA: la sección más profunda (`entryRelationship ▸ observation ▸ value`) visible; `Patient: …` en el resumen.
5. Tema oscuro (toggle): el aspecto es idéntico al de `master` (comparar lado a lado con `git stash`/otra pestaña en `master`).
6. Pegar un C-CDA grande (>5000 nodos, o bajar `maxItems` a 50 temporalmente): aparece el aviso "Showing the first …".
7. HL7 con `PID|1||X||<img src=x onerror=alert(1)>^EVIL`: el resumen muestra el texto literal y no aparece ningún alert.
8. FHIR `{"resourceType":"Bundle","type":"collection","entry":[{"resource":{"resourceType":"List","contained":[{"resourceType":"Patient","name":[{"family":"X"}]}]}}]}`: se renderiza sin errores en consola.

- [ ] **Step 10: Commit**

```bash
git add src/modules/UIController.js
git commit -m "fix(ui): show every mapped level, drive summaries from parser data, render FHIR bundles from JSON"
```

---

### Task 8: Limpieza (ponytail-review) + verificación final

**Files:**
- Modify: `src/modules/UIController.js`, `src/modules/MessageParser.js`, `package.json`, `package-lock.json`

Todo lo de esta tarea es borrar código que, tras Tasks 1–7, no tiene llamadores. Antes de borrar cada método, confirmar con `grep -n "nombreMetodo" src -r` que solo aparece su definición.

- [ ] **Step 1: Borrar métodos muertos de `UIController.js`**

Borrar completos: `countBundleResources`, `countBundleResourcesFromStructure`, `findNestedValue`, `extractPatientName`, `extractPatientReference`, `countClinicalSections`, `countFHIRResources`, `addTreeSection`, `createTreeData`, `processTreeItem`, `createDeepTreeNode`, `renderTreeNode`, `addAnalysisSection`, `createCCDAEnhancedStructure`, `processCCDAItem`, `shouldIncludeCCDAField`, `isCCDAPriorityField`, `createCCDATreeStructure`, `createCCDASection`, `createFHIRBundleStructure`, `extractBundleMetadata`, `processBundleEntries`, `processFHIRResource`, `processObservationResource`, `processComplexField`, `findResourceField`, `findNestedResourceField`, `findNestedFieldValue`, `processGenericFHIRResource`, `processFHIRStructure`, `findFieldData`, `findFieldValue`, `shouldSkipTechnicalItem`, `isClinicallyRelevant`.

Conservar: `formatValue` (lo usa `addSimplifiedAnalysisSection`), `isTableStructure`/`processTableStructure`/`extractTextContent` (tablas de narrativa C-CDA).

- [ ] **Step 2: `MessageParser.js`**

- `hl7Segments`: quitar las claves duplicadas (`OBX`, `PID`, `PV1`, `AIG`, `AIL`, `AIP`, `AIS`, `NTE` aparecen dos veces).
- `parse()`: los parsers ya lanzan mensajes con contexto; dejar un solo envoltorio:

```js
  parse(message, format) {
    const parsers = { hl7v2: this.parseHL7v2, hl7v3: this.parseHL7v3, fhir: this.parseFHIR, astm: this.parseASTM, json: this.parseJSON, xml: this.parseXML }
    if (!parsers[format]) throw new Error(`Unsupported format: ${format}`)
    try {
      return parsers[format].call(this, message)
    } catch (error) {
      throw new Error(`Failed to parse ${format} message: ${error.message}`)
    }
  }
```

- `parseJSON`: quitar su `try/catch` interno (el de `parse()` ya envuelve) y usar `MAX_INPUT`.

- [ ] **Step 3: Dependencia sin uso**

Run: `npm uninstall js-beautify`
Expected: `package.json` y `package-lock.json` sin `js-beautify`.

- [ ] **Step 4: Verificación final**

Run: `npm test && npm run build && git grep -n "DOMParser" src/modules/MessageParser.js src/modules/FormatDetector.js`
Expected: tests PASS, build OK, grep sin resultados (exit 1).

Repetir los 6 checks del navegador de Task 7 Step 9.

- [ ] **Step 5: Commit**

```bash
git add -A src package.json package-lock.json
git commit -m "chore: delete dead UI/parser code and unused js-beautify dependency"
```

---

## Fuera de alcance (anotado, no planificado)

- Definiciones de IN1/IN2/GT1/ACC/FT1/RXA/RXE/SCH/AIS/TXA: hoy caen a nombres posicionales con componentes igual mapeados. Se agregan como datos en `hl7v2Definitions.js` cuando se necesiten.
- Validación de checksums ASTM E1381 y de cardinalidad FHIR (requiere StructureDefinitions).
- `SyntheticDataGenerator.js` (1139 líneas) no se revisó a fondo; solo se usó para confirmar el formato ASTM que genera.
- `generateJSONSummary` lee `analysis.elementCount`, que JSON no produce ("0 elements"). Arreglo de una línea si importa.
