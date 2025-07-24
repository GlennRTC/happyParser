import { faker } from '@faker-js/faker'
import { v4 as uuidv4 } from 'uuid'
import { format, subDays, addDays, addHours } from 'date-fns'

export class SyntheticDataGenerator {
  constructor() {
    // Consistent session data for cross-references
    this.sessionData = this.generateSessionData()
    this.messageControlId = 1
    this.orderSequence = 1
  }

  generateSessionData() {
    return {
      patientId: faker.string.alphanumeric(8).toUpperCase(),
      accountNumber: faker.string.numeric(10),
      visitNumber: faker.string.alphanumeric(7).toUpperCase(),
      mrn: faker.string.alphanumeric(10).toUpperCase(),
      lastName: faker.person.lastName(),
      firstName: faker.person.firstName(),
      middleName: faker.person.middleName(),
      birthDate: faker.date.birthdate({ min: 18, max: 85, mode: 'age' }),
      gender: faker.helpers.arrayElement(['M', 'F']),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode()
      },
      phone: faker.phone.number(),
      ssn: faker.string.numeric(9),
      admitDate: subDays(new Date(), faker.number.int({ min: 0, max: 7 })),
      physician: {
        id: faker.string.numeric(6),
        lastName: faker.person.lastName(),
        firstName: faker.person.firstName()
      }
    }
  }

  // Refresh session data for new patient
  newPatient() {
    this.sessionData = this.generateSessionData()
    this.messageControlId = 1
    this.orderSequence = 1
  }

  // HL7 v2.x Generators
  generateHL7v2Message(messageType, options = {}) {
    const { numResults = 1, numOrders = 1 } = options
    
    switch (messageType) {
      case 'ORU^R01':
        return this.generateORUMessage(Math.min(numResults, 10))
      case 'OUL^R21':
        return this.generateOULMessage(Math.min(numResults, 10))
      case 'ADT^A01':
        return this.generateADTMessage()
      default:
        return this.generateORUMessage(1)
    }
  }

  generateORUMessage(numResults = 1) {
    const timestamp = this.formatHL7Timestamp(new Date())
    
    let message = this.generateMSHSegment('ORU^R01', timestamp) + '\r'
    message += this.generatePIDSegment() + '\r'
    message += this.generatePV1Segment() + '\r'
    
    // Generate ONE test order (OBR) with multiple results (OBX)
    const orderNumber = this.getNextOrderNumber()
    message += this.generateOBRSegment(orderNumber, 1) + '\r'
    
    // Generate the specified number of OBX segments under this single OBR
    for (let i = 0; i < Math.min(numResults, 10); i++) {
      message += this.generateOBXSegment(i + 1) + '\r'
    }
    
    return message.slice(0, -1) // Remove last \r
  }

  generateOULMessage(numResults = 1) {
    const timestamp = this.formatHL7Timestamp(new Date())
    
    let message = this.generateMSHSegment('OUL^R21', timestamp) + '\r'
    message += this.generatePIDSegment() + '\r'
    message += this.generatePV1Segment() + '\r'
    
    // Generate ONE test order (OBR) with specimen and multiple results (OBX)
    const orderNumber = this.getNextOrderNumber()
    message += this.generateOBRSegment(orderNumber, 1) + '\r'
    
    // OUL typically has specimen-related segments
    message += this.generateSPMSegment(1) + '\r'
    
    // Generate the specified number of OBX segments under this single OBR
    for (let i = 0; i < Math.min(numResults, 10); i++) {
      message += this.generateOBXSegment(i + 1) + '\r'
    }
    
    return message.slice(0, -1)
  }

  generateADTMessage() {
    const timestamp = this.formatHL7Timestamp(new Date())
    
    let message = this.generateMSHSegment('ADT^A01', timestamp) + '\r'
    message += this.generateEVNSegment() + '\r'
    message += this.generatePIDSegment() + '\r'
    message += this.generatePV1Segment() + '\r'
    
    return message.slice(0, -1)
  }

  // HL7 Segment Generators
  generateMSHSegment(messageType, timestamp) {
    return `MSH|^~\\&|${faker.company.name()}|${faker.location.city()}|HIS|HOSPITAL|${timestamp}||${messageType}|${this.getNextMessageControlId()}|P|2.5`
  }

  generatePIDSegment() {
    const birthDate = this.formatHL7Date(this.sessionData.birthDate)
    return `PID|1||${this.sessionData.patientId}^^^HOSPITAL^MR~${this.sessionData.mrn}^^^HOSPITAL^MRN||${this.sessionData.lastName}^${this.sessionData.firstName}^${this.sessionData.middleName}||${birthDate}|${this.sessionData.gender}|||${this.sessionData.address.street}^${this.sessionData.address.city}^${this.sessionData.address.state}^${this.sessionData.address.zip}||(${this.sessionData.phone.slice(0,3)})${this.sessionData.phone.slice(3,6)}-${this.sessionData.phone.slice(6)}|||${this.sessionData.ssn}||${this.sessionData.accountNumber}|||||||||||||||`
  }

  generatePV1Segment() {
    const admitTime = this.formatHL7Timestamp(this.sessionData.admitDate)
    return `PV1|1|I|${faker.string.alphanumeric(3)}^${faker.string.alphanumeric(3)}^${faker.string.alphanumeric(2)}|E|||${this.sessionData.physician.id}^${this.sessionData.physician.lastName}^${this.sessionData.physician.firstName}|||MED||||A|||${this.sessionData.physician.id}^${this.sessionData.physician.lastName}^${this.sessionData.physician.firstName}|INP|||||||||||||||||||||||||${admitTime}`
  }

  generateEVNSegment() {
    const eventTime = this.formatHL7Timestamp(this.sessionData.admitDate)
    return `EVN||${eventTime}|||${this.sessionData.physician.id}^${this.sessionData.physician.lastName}^${this.sessionData.physician.firstName}`
  }

  generateOBRSegment(orderNumber, setId) {
    const orderDateTime = this.formatHL7Timestamp(subDays(new Date(), faker.number.int({ min: 0, max: 3 })))
    const testCode = faker.helpers.arrayElement(['CBC', 'BMP', 'CMP', 'LIPID', 'TSH', 'UA', 'PT/INR', 'BNP'])
    
    return `OBR|${setId}|${orderNumber}|${orderNumber}|${faker.string.alphanumeric(5)}^${testCode}^L|||${orderDateTime}||||||||${this.sessionData.physician.id}^${this.sessionData.physician.lastName}^${this.sessionData.physician.firstName}||||||||F`
  }

  generateOBXSegment(setId) {
    const testName = faker.helpers.arrayElement([
      'Glucose', 'Hemoglobin', 'Hematocrit', 'WBC', 'Sodium', 'Potassium', 
      'Chloride', 'CO2', 'BUN', 'Creatinine', 'Total Protein', 'Albumin'
    ])
    const resultValue = faker.number.float({ min: 1.0, max: 200.0, fractionDigits: 1 })
    const units = faker.helpers.arrayElement(['mg/dL', 'mmol/L', 'IU/L', '%', 'g/dL', 'K/uL'])
    const referenceRange = `${faker.number.float({ min: 1, max: 10, fractionDigits: 1 })}-${faker.number.float({ min: 10, max: 50, fractionDigits: 1 })}`
    
    return `OBX|${setId}|NM|${faker.string.alphanumeric(5)}^${testName}^L||${resultValue}|${units}|${referenceRange}|N|||F|||${this.formatHL7Timestamp(new Date())}`
  }

  generateSPMSegment(setId) {
    const specimenType = faker.helpers.arrayElement(['BLOOD', 'SERUM', 'PLASMA', 'URINE', 'CSF'])
    const collectionTime = this.formatHL7Timestamp(subDays(new Date(), 1))
    
    return `SPM|${setId}|${faker.string.alphanumeric(8)}||${specimenType}|||||||P||||||${collectionTime}`
  }

  // HL7 v3.x (CDA) Generators
  generateHL7v3Document(documentType, options = {}) {
    switch (documentType) {
      case 'CCD':
        return this.generateContinuityOfCareDocument()
      case 'LabReport':
        return this.generateCDALabReport(options.numResults)
      case 'DischargeSummary':
        return this.generateDischargeSummary()
      case 'ProgressNote':
        return this.generateProgressNote()
      case 'ConsultationNote':
        return this.generateConsultationNote()
      case 'HistoryAndPhysical':
        return this.generateHistoryAndPhysical()
      default:
        return this.generateContinuityOfCareDocument()
    }
  }

  generateContinuityOfCareDocument() {
    const docId = uuidv4()
    const effectiveTime = format(new Date(), 'yyyyMMddHHmmss')
    const patientExtension = this.sessionData.patientId
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <templateId root="2.16.840.1.113883.10.20.22.1.2" extension="2015-08-01"/>
  <id extension="${docId}" root="2.16.840.1.113883.19.5"/>
  <code code="34133-9" displayName="Summary of episode note" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
  <title>Continuity of Care Document</title>
  <effectiveTime value="${effectiveTime}"/>
  <confidentialityCode code="N" displayName="Normal" codeSystem="2.16.840.1.113883.5.25" codeSystemName="Confidentiality"/>
  <languageCode code="en-US"/>
  <setId extension="${docId}" root="2.16.840.1.113883.19.5"/>
  <versionNumber value="1"/>
  
  <recordTarget>
    <patientRole>
      <id extension="${patientExtension}" root="2.16.840.1.113883.19.5"/>
      <addr use="HP">
        <streetAddressLine>${this.sessionData.address.street}</streetAddressLine>
        <city>${this.sessionData.address.city}</city>
        <state>${this.sessionData.address.state}</state>
        <postalCode>${this.sessionData.address.zip}</postalCode>
        <country>US</country>
      </addr>
      <telecom value="tel:${this.sessionData.phone}" use="HP"/>
      <patient>
        <name use="L">
          <given>${this.sessionData.firstName}</given>
          <given>${this.sessionData.middleName}</given>
          <family>${this.sessionData.lastName}</family>
        </name>
        <administrativeGenderCode code="${this.sessionData.gender}" displayName="${this.sessionData.gender === 'M' ? 'Male' : 'Female'}" codeSystem="2.16.840.1.113883.5.1" codeSystemName="AdministrativeGender"/>
        <birthTime value="${this.formatHL7Date(this.sessionData.birthDate)}"/>
      </patient>
    </patientRole>
  </recordTarget>
  
  <author>
    <time value="${effectiveTime}"/>
    <assignedAuthor>
      <id extension="${this.sessionData.physician.id}" root="2.16.840.1.113883.19.5"/>
      <assignedPerson>
        <name>
          <given>${this.sessionData.physician.firstName}</given>
          <family>${this.sessionData.physician.lastName}</family>
        </name>
      </assignedPerson>
    </assignedAuthor>
  </author>
  
  <custodian>
    <assignedCustodian>
      <representedCustodianOrganization>
        <id extension="99999999" root="2.16.840.1.113883.4.6"/>
        <name>${faker.company.name()} Healthcare</name>
        <telecom value="tel:${faker.phone.number()}" use="WP"/>
        <addr>
          <streetAddressLine>${faker.location.streetAddress()}</streetAddressLine>
          <city>${faker.location.city()}</city>
          <state>${faker.location.state({ abbreviated: true })}</state>
          <postalCode>${faker.location.zipCode()}</postalCode>
          <country>US</country>
        </addr>
      </representedCustodianOrganization>
    </assignedCustodian>
  </custodian>
  
  <component>
    <structuredBody>
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.6.1"/>
          <code code="48765-2" displayName="Allergies, adverse reactions, alerts" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>ALLERGIES</title>
          <text>
            <table border="1" width="100%">
              <thead>
                <tr>
                  <th>Substance</th>
                  <th>Reaction</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>No Known Allergies</td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </text>
        </section>
      </component>
      
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.1.1"/>
          <code code="10160-0" displayName="History of medication use" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>MEDICATIONS</title>
          <text>
            <table border="1" width="100%">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${faker.helpers.arrayElement(['Lisinopril', 'Metformin', 'Atorvastatin', 'Amlodipine'])}</td>
                  <td>${faker.number.int({ min: 5, max: 40 })}mg</td>
                  <td>Daily</td>
                </tr>
              </tbody>
            </table>
          </text>
        </section>
      </component>
      
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.5.1"/>
          <code code="11450-4" displayName="Problem list" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>PROBLEMS</title>
          <text>
            <table border="1" width="100%">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${faker.helpers.arrayElement(['Hypertension', 'Diabetes Type 2', 'Hyperlipidemia', 'Asthma'])}</td>
                  <td>Active</td>
                  <td>${format(subDays(new Date(), faker.number.int({ min: 30, max: 365 })), 'MM/dd/yyyy')}</td>
                </tr>
              </tbody>
            </table>
          </text>
        </section>
      </component>
    </structuredBody>
  </component>
</ClinicalDocument>`
  }

  generateCDALabReport(numResults = 1) {
    const docId = uuidv4()
    const effectiveTime = format(new Date(), 'yyyyMMddHHmmss')
    const patientExtension = this.sessionData.patientId
    
    let resultsSection = ''
    for (let i = 0; i < Math.min(numResults, 10); i++) {
      const testName = faker.helpers.arrayElement(['Glucose', 'Hemoglobin', 'WBC Count', 'Sodium', 'Potassium'])
      const resultValue = faker.number.float({ min: 1, max: 200, fractionDigits: 1 })
      const units = faker.helpers.arrayElement(['mg/dL', 'g/dL', 'K/uL', 'mEq/L'])
      
      resultsSection += `
                <tr>
                  <td>${testName}</td>
                  <td>${resultValue}</td>
                  <td>${units}</td>
                  <td>Normal</td>
                </tr>`
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <templateId root="2.16.840.1.113883.10.20.22.1.1" extension="2015-08-01"/>
  <id extension="${docId}" root="2.16.840.1.113883.19.5"/>
  <code code="11502-2" displayName="Laboratory report" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
  <title>Laboratory Report</title>
  <effectiveTime value="${effectiveTime}"/>
  <confidentialityCode code="N" displayName="Normal" codeSystem="2.16.840.1.113883.5.25" codeSystemName="Confidentiality"/>
  <languageCode code="en-US"/>
  
  <recordTarget>
    <patientRole>
      <id extension="${patientExtension}" root="2.16.840.1.113883.19.5"/>
      <addr use="HP">
        <streetAddressLine>${this.sessionData.address.street}</streetAddressLine>
        <city>${this.sessionData.address.city}</city>
        <state>${this.sessionData.address.state}</state>
        <postalCode>${this.sessionData.address.zip}</postalCode>
      </addr>
      <patient>
        <name use="L">
          <given>${this.sessionData.firstName}</given>
          <family>${this.sessionData.lastName}</family>
        </name>
        <administrativeGenderCode code="${this.sessionData.gender}" codeSystem="2.16.840.1.113883.5.1"/>
        <birthTime value="${this.formatHL7Date(this.sessionData.birthDate)}"/>
      </patient>
    </patientRole>
  </recordTarget>
  
  <author>
    <time value="${effectiveTime}"/>
    <assignedAuthor>
      <id extension="${this.sessionData.physician.id}" root="2.16.840.1.113883.19.5"/>
      <assignedPerson>
        <name>
          <given>${this.sessionData.physician.firstName}</given>
          <family>${this.sessionData.physician.lastName}</family>
        </name>
      </assignedPerson>
    </assignedAuthor>
  </author>
  
  <custodian>
    <assignedCustodian>
      <representedCustodianOrganization>
        <id extension="99999999" root="2.16.840.1.113883.4.6"/>
        <name>${faker.company.name()} Laboratory</name>
      </representedCustodianOrganization>
    </assignedCustodian>
  </custodian>
  
  <component>
    <structuredBody>
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.3.1"/>
          <code code="30954-2" displayName="Relevant diagnostic tests and/or laboratory data" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>LABORATORY RESULTS</title>
          <text>
            <table border="1" width="100%">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Result</th>
                  <th>Units</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${resultsSection}
              </tbody>
            </table>
          </text>
        </section>
      </component>
    </structuredBody>
  </component>
</ClinicalDocument>`
  }

  generateDischargeSummary() {
    const docId = uuidv4()
    const effectiveTime = format(new Date(), 'yyyyMMddHHmmss')
    const patientExtension = this.sessionData.patientId
    const dischargeDateObj = addDays(this.sessionData.admitDate, faker.number.int({ min: 2, max: 14 }))
    const dischargeDate = format(dischargeDateObj, 'yyyyMMdd')
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <templateId root="2.16.840.1.113883.10.20.22.1.8" extension="2015-08-01"/>
  <id extension="${docId}" root="2.16.840.1.113883.19.5"/>
  <code code="18842-5" displayName="Discharge summary" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
  <title>Discharge Summary</title>
  <effectiveTime value="${effectiveTime}"/>
  <confidentialityCode code="N" displayName="Normal" codeSystem="2.16.840.1.113883.5.25" codeSystemName="Confidentiality"/>
  <languageCode code="en-US"/>
  
  <recordTarget>
    <patientRole>
      <id extension="${patientExtension}" root="2.16.840.1.113883.19.5"/>
      <patient>
        <name use="L">
          <given>${this.sessionData.firstName}</given>
          <family>${this.sessionData.lastName}</family>
        </name>
        <administrativeGenderCode code="${this.sessionData.gender}" codeSystem="2.16.840.1.113883.5.1"/>
        <birthTime value="${this.formatHL7Date(this.sessionData.birthDate)}"/>
      </patient>
    </patientRole>
  </recordTarget>
  
  <component>
    <structuredBody>
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.24"/>
          <code code="42348-3" displayName="Advance directives" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>HOSPITAL COURSE</title>
          <text>
            <paragraph>Patient admitted on ${format(this.sessionData.admitDate, 'MM/dd/yyyy')} with ${faker.helpers.arrayElement(['chest pain', 'shortness of breath', 'abdominal pain', 'fever'])}. Treatment included ${faker.helpers.arrayElement(['IV antibiotics', 'cardiac monitoring', 'pain management', 'fluid resuscitation'])}. Patient responded well to treatment and was discharged on ${format(dischargeDateObj, 'MM/dd/yyyy')} in stable condition.</paragraph>
          </text>
        </section>
      </component>
      
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.11"/>
          <code code="10183-2" displayName="Hospital discharge medications" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>DISCHARGE MEDICATIONS</title>
          <text>
            <list>
              <item>${faker.helpers.arrayElement(['Lisinopril 10mg daily', 'Metformin 500mg twice daily', 'Atorvastatin 20mg daily'])}</item>
              <item>${faker.helpers.arrayElement(['Amlodipine 5mg daily', 'Furosemide 20mg daily', 'Aspirin 81mg daily'])}</item>
            </list>
          </text>
        </section>
      </component>
    </structuredBody>
  </component>
</ClinicalDocument>`
  }

  generateProgressNote() {
    const docId = uuidv4()
    const effectiveTime = format(new Date(), 'yyyyMMddHHmmss')
    const patientExtension = this.sessionData.patientId
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <templateId root="2.16.840.1.113883.10.20.22.1.9" extension="2015-08-01"/>
  <id extension="${docId}" root="2.16.840.1.113883.19.5"/>
  <code code="11506-3" displayName="Progress note" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
  <title>Progress Note</title>
  <effectiveTime value="${effectiveTime}"/>
  <confidentialityCode code="N" displayName="Normal" codeSystem="2.16.840.1.113883.5.25" codeSystemName="Confidentiality"/>
  <languageCode code="en-US"/>
  
  <recordTarget>
    <patientRole>
      <id extension="${patientExtension}" root="2.16.840.1.113883.19.5"/>
      <patient>
        <name use="L">
          <given>${this.sessionData.firstName}</given>
          <family>${this.sessionData.lastName}</family>
        </name>
        <administrativeGenderCode code="${this.sessionData.gender}" codeSystem="2.16.840.1.113883.5.1"/>
        <birthTime value="${this.formatHL7Date(this.sessionData.birthDate)}"/>
      </patient>
    </patientRole>
  </recordTarget>
  
  <component>
    <structuredBody>
      <component>
        <section>
          <code code="10164-2" displayName="History of present illness" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>ASSESSMENT AND PLAN</title>
          <text>
            <paragraph>Patient continues to show ${faker.helpers.arrayElement(['improvement', 'stable condition', 'gradual recovery'])} with current treatment plan. ${faker.helpers.arrayElement(['Vital signs stable', 'Laboratory values within normal limits', 'Patient tolerating medications well'])}. Plan to ${faker.helpers.arrayElement(['continue current medications', 'monitor closely', 'discharge tomorrow if stable'])}.</paragraph>
          </text>
        </section>
      </component>
    </structuredBody>
  </component>
</ClinicalDocument>`
  }

  generateConsultationNote() {
    const docId = uuidv4()
    const effectiveTime = format(new Date(), 'yyyyMMddHHmmss')
    const patientExtension = this.sessionData.patientId
    const consultationType = faker.helpers.arrayElement(['Cardiology', 'Pulmonology', 'Endocrinology', 'Nephrology', 'Gastroenterology'])
    const chiefComplaint = faker.helpers.arrayElement(['chest pain', 'shortness of breath', 'diabetes management', 'hypertension', 'abdominal pain'])
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <templateId root="2.16.840.1.113883.10.20.22.1.4" extension="2015-08-01"/>
  <id extension="${docId}" root="2.16.840.1.113883.19.5"/>
  <code code="11488-4" displayName="Consult note" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
  <title>${consultationType} Consultation Note</title>
  <effectiveTime value="${effectiveTime}"/>
  <confidentialityCode code="N" displayName="Normal" codeSystem="2.16.840.1.113883.5.25" codeSystemName="Confidentiality"/>
  <languageCode code="en-US"/>
  
  <recordTarget>
    <patientRole>
      <id extension="${patientExtension}" root="2.16.840.1.113883.19.5"/>
      <addr use="HP">
        <streetAddressLine>${this.sessionData.address.street}</streetAddressLine>
        <city>${this.sessionData.address.city}</city>
        <state>${this.sessionData.address.state}</state>
        <postalCode>${this.sessionData.address.zip}</postalCode>
        <country>US</country>
      </addr>
      <telecom value="tel:${this.sessionData.phone}" use="HP"/>
      <patient>
        <name use="L">
          <given>${this.sessionData.firstName}</given>
          <given>${this.sessionData.middleName}</given>  
          <family>${this.sessionData.lastName}</family>
        </name>
        <administrativeGenderCode code="${this.sessionData.gender}" displayName="${this.sessionData.gender === 'M' ? 'Male' : 'Female'}" codeSystem="2.16.840.1.113883.5.1" codeSystemName="AdministrativeGender"/>
        <birthTime value="${this.formatHL7Date(this.sessionData.birthDate)}"/>
      </patient>
    </patientRole>
  </recordTarget>
  
  <author>
    <time value="${effectiveTime}"/>
    <assignedAuthor>
      <id extension="${this.sessionData.physician.id}" root="2.16.840.1.113883.19.5"/>
      <assignedPerson>
        <name>
          <given>${this.sessionData.physician.firstName}</given>
          <family>${this.sessionData.physician.lastName}</family>
        </name>
      </assignedPerson>
    </assignedAuthor>
  </author>
  
  <component>
    <structuredBody>
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.13"/>
          <code code="10164-2" displayName="History of present illness" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>HISTORY OF PRESENT ILLNESS</title>
          <text>
            <paragraph>Patient presents for ${consultationType.toLowerCase()} consultation regarding ${chiefComplaint}. ${faker.helpers.arrayElement(['Symptoms began approximately', 'Patient reports', 'History notable for'])} ${faker.helpers.arrayElement(['3 weeks ago', '2 months ago', 'recent worsening of'])} ${faker.helpers.arrayElement(['with intermittent episodes', 'with progressive worsening', 'following medication changes'])}.</paragraph>
          </text>
        </section>
      </component>
      
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.8"/>
          <code code="51847-2" displayName="Assessment and plan" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>ASSESSMENT AND PLAN</title>
          <text>
            <paragraph>Impression: ${faker.helpers.arrayElement(['Likely', 'Probable', 'Rule out'])} ${faker.helpers.arrayElement(['cardiovascular etiology', 'pulmonary pathology', 'metabolic disorder', 'inflammatory process'])}. Recommend ${faker.helpers.arrayElement(['additional testing including', 'initiation of', 'optimization of current'])} ${faker.helpers.arrayElement(['echocardiogram and stress test', 'pulmonary function tests', 'comprehensive metabolic panel', 'anti-inflammatory therapy'])}. Follow up in ${faker.helpers.arrayElement(['2-4 weeks', '1 month', '6-8 weeks'])} or sooner if symptoms worsen.</paragraph>
          </text>
        </section>
      </component>
    </structuredBody>
  </component>
</ClinicalDocument>`
  }

  generateHistoryAndPhysical() {
    const docId = uuidv4()
    const effectiveTime = format(new Date(), 'yyyyMMddHHmmss')
    const patientExtension = this.sessionData.patientId
    const admissionReason = faker.helpers.arrayElement(['chest pain', 'shortness of breath', 'abdominal pain', 'altered mental status', 'fever and chills'])
    const vitals = {
      temp: faker.number.float({ min: 97.0, max: 101.5, fractionDigits: 1 }),
      bp_sys: faker.number.int({ min: 110, max: 160 }),
      bp_dia: faker.number.int({ min: 60, max: 100 }),
      hr: faker.number.int({ min: 60, max: 110 }),
      rr: faker.number.int({ min: 12, max: 24 }),
      o2sat: faker.number.int({ min: 95, max: 100 })
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <templateId root="2.16.840.1.113883.10.20.22.1.3" extension="2015-08-01"/>
  <id extension="${docId}" root="2.16.840.1.113883.19.5"/>
  <code code="34117-2" displayName="History and physical note" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
  <title>History and Physical Examination</title>
  <effectiveTime value="${effectiveTime}"/>
  <confidentialityCode code="N" displayName="Normal" codeSystem="2.16.840.1.113883.5.25" codeSystemName="Confidentiality"/>
  <languageCode code="en-US"/>
  
  <recordTarget>
    <patientRole>
      <id extension="${patientExtension}" root="2.16.840.1.113883.19.5"/>
      <addr use="HP">
        <streetAddressLine>${this.sessionData.address.street}</streetAddressLine>
        <city>${this.sessionData.address.city}</city>
        <state>${this.sessionData.address.state}</state>
        <postalCode>${this.sessionData.address.zip}</postalCode>
        <country>US</country>
      </addr>
      <telecom value="tel:${this.sessionData.phone}" use="HP"/>
      <patient>
        <name use="L">
          <given>${this.sessionData.firstName}</given>
          <given>${this.sessionData.middleName}</given>
          <family>${this.sessionData.lastName}</family>
        </name>
        <administrativeGenderCode code="${this.sessionData.gender}" displayName="${this.sessionData.gender === 'M' ? 'Male' : 'Female'}" codeSystem="2.16.840.1.113883.5.1" codeSystemName="AdministrativeGender"/>
        <birthTime value="${this.formatHL7Date(this.sessionData.birthDate)}"/>
      </patient>
    </patientRole>
  </recordTarget>
  
  <author>
    <time value="${effectiveTime}"/>
    <assignedAuthor>
      <id extension="${this.sessionData.physician.id}" root="2.16.840.1.113883.19.5"/>
      <assignedPerson>
        <name>
          <given>${this.sessionData.physician.firstName}</given>
          <family>${this.sessionData.physician.lastName}</family>
        </name>
      </assignedPerson>
    </assignedAuthor>
  </author>
  
  <component>
    <structuredBody>
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.13"/>
          <code code="10164-2" displayName="History of present illness" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>HISTORY OF PRESENT ILLNESS</title>
          <text>
            <paragraph>${this.sessionData.firstName} ${this.sessionData.lastName} is a ${faker.datatype.number({ min: 18, max: 85 })}-year-old ${this.sessionData.gender === 'M' ? 'male' : 'female'} presenting with ${admissionReason}. ${faker.helpers.arrayElement(['Symptoms began', 'Patient reports onset of', 'Complaint started'])} ${faker.helpers.arrayElement(['this morning', 'yesterday evening', '2 days ago', 'gradually over the past week'])}. ${faker.helpers.arrayElement(['Associated with', 'Patient also reports', 'Notable for'])} ${faker.helpers.arrayElement(['nausea and vomiting', 'dizziness', 'fatigue', 'no radiation', 'mild diaphoresis'])}.</paragraph>
          </text>
        </section>
      </component>
      
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.4.1"/>
          <code code="8716-3" displayName="Vital signs" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>VITAL SIGNS</title>
          <text>
            <table border="1" width="100%">
              <thead>
                <tr><th>Vital Sign</th><th>Value</th><th>Unit</th></tr>
              </thead>
              <tbody>
                <tr><td>Temperature</td><td>${vitals.temp}</td><td>°F</td></tr>
                <tr><td>Blood Pressure</td><td>${vitals.bp_sys}/${vitals.bp_dia}</td><td>mmHg</td></tr>
                <tr><td>Heart Rate</td><td>${vitals.hr}</td><td>bpm</td></tr>
                <tr><td>Respiratory Rate</td><td>${vitals.rr}</td><td>breaths/min</td></tr>
                <tr><td>Oxygen Saturation</td><td>${vitals.o2sat}</td><td>%</td></tr>
              </tbody>
            </table>
          </text>
        </section>
      </component>
      
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.10"/>
          <code code="29545-1" displayName="Physical examination" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>PHYSICAL EXAMINATION</title>
          <text>
            <paragraph>General: ${faker.helpers.arrayElement(['Well-appearing', 'Appears stated age', 'Alert and oriented'])} ${this.sessionData.gender === 'M' ? 'male' : 'female'} in ${faker.helpers.arrayElement(['no acute distress', 'mild distress', 'moderate distress'])}.</paragraph>
            <paragraph>HEENT: ${faker.helpers.arrayElement(['Normocephalic, atraumatic', 'PERRL, EOMI', 'Oropharynx clear'])}. ${faker.helpers.arrayElement(['No lymphadenopathy', 'Neck supple', 'No JVD'])}.</paragraph>
            <paragraph>Cardiovascular: ${faker.helpers.arrayElement(['RRR', 'Regular rate and rhythm'])}. ${faker.helpers.arrayElement(['No murmurs, rubs, or gallops', 'S1 and S2 present', 'Normal heart sounds'])}.</paragraph>
            <paragraph>Pulmonary: ${faker.helpers.arrayElement(['Clear to auscultation bilaterally', 'Good air movement', 'No wheezes, rales, or rhonchi'])}.</paragraph>
            <paragraph>Abdomen: ${faker.helpers.arrayElement(['Soft, non-tender, non-distended', 'Bowel sounds present', 'No organomegaly'])}. ${faker.helpers.arrayElement(['No masses palpated', 'No rebound or guarding', 'Non-tender to palpation'])}.</paragraph>
          </text>
        </section>
      </component>
      
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.8"/>
          <code code="51847-2" displayName="Assessment and plan" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>ASSESSMENT AND PLAN</title>
          <text>
            <paragraph>Assessment: ${faker.helpers.arrayElement(['Working diagnosis of', 'Likely', 'Rule out'])} ${faker.helpers.arrayElement(['acute coronary syndrome', 'pneumonia', 'gastroenteritis', 'urinary tract infection', 'viral syndrome'])}. Plan: ${faker.helpers.arrayElement(['Obtain CBC, BMP, troponins', 'Chest X-ray and EKG', 'IV fluids and symptomatic care', 'Blood cultures and urinalysis'])}. ${faker.helpers.arrayElement(['Serial cardiac enzymes', 'Repeat vitals q4h', 'NPO for now', 'Monitor I/Os closely'])}. Will reassess in AM.</paragraph>
          </text>
        </section>
      </component>
    </structuredBody>
  </component>
</ClinicalDocument>`
  }

  // FHIR R4/R5 Generators
  generateFHIRResource(resourceType, options = {}) {
    switch (resourceType) {
      case 'Patient':
        return this.generateFHIRPatient()
      case 'Encounter':
        return this.generateFHIREncounter()
      case 'Observation':
        return this.generateFHIRObservation(options.numResults)
      case 'DiagnosticReport':
        return this.generateFHIRDiagnosticReport(options.numResults)
      case 'ServiceRequest':
        return this.generateFHIRServiceRequest(options.numResults)
      default:
        return this.generateFHIRPatient()
    }
  }

  generateFHIRPatient() {
    return {
      resourceType: 'Patient',
      id: this.sessionData.patientId.toLowerCase(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString(),
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient']
      },
      identifier: [
        {
          use: 'usual',
          type: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MR',
              display: 'Medical Record Number'
            }]
          },
          system: 'http://hospital.example.org',
          value: this.sessionData.mrn
        }
      ],
      active: true,
      name: [{
        use: 'official',
        family: this.sessionData.lastName,
        given: [this.sessionData.firstName, this.sessionData.middleName]
      }],
      telecom: [{
        system: 'phone',
        value: this.sessionData.phone,
        use: 'home'
      }],
      gender: this.sessionData.gender.toLowerCase() === 'm' ? 'male' : 'female',
      birthDate: format(this.sessionData.birthDate, 'yyyy-MM-dd'),
      address: [{
        use: 'home',
        line: [this.sessionData.address.street],
        city: this.sessionData.address.city,
        state: this.sessionData.address.state,
        postalCode: this.sessionData.address.zip,
        country: 'US'
      }]
    }
  }

  generateFHIREncounter() {
    return {
      resourceType: 'Encounter',
      id: this.sessionData.visitNumber.toLowerCase(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      },
      status: 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'IMP',
        display: 'inpatient encounter'
      },
      type: [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '32485007',
          display: 'Hospital admission'
        }]
      }],
      subject: {
        reference: `Patient/${this.sessionData.patientId.toLowerCase()}`,
        display: `${this.sessionData.firstName} ${this.sessionData.lastName}`
      },
      period: {
        start: this.sessionData.admitDate.toISOString()
      },
      participant: [{
        individual: {
          reference: `Practitioner/${this.sessionData.physician.id}`,
          display: `Dr. ${this.sessionData.physician.firstName} ${this.sessionData.physician.lastName}`
        }
      }]
    }
  }

  generateFHIRObservation(numResults = 1) {
    // Generate multiple Observations in a Bundle if numResults > 1
    if (numResults > 1) {
      const bundle = {
        resourceType: 'Bundle',
        id: uuidv4(),
        meta: {
          lastUpdated: new Date().toISOString()
        },
        type: 'collection',
        entry: []
      }
      
      // Create separate Observation for each test
      for (let i = 0; i < Math.min(numResults, 10); i++) {
        const observation = this.generateSingleFHIRObservation(i + 1)
        bundle.entry.push({
          resource: observation
        })
      }
      
      return bundle
    } else {
      return this.generateSingleFHIRObservation(1)
    }
  }

  generateSingleFHIRObservation(testNumber) {
    const testDetails = [
      { name: 'Glucose', loinc: '33747-0', unit: 'mg/dL' },
      { name: 'Hemoglobin', loinc: '718-7', unit: 'g/dL' },
      { name: 'Hematocrit', loinc: '4544-3', unit: '%' },
      { name: 'WBC Count', loinc: '6690-2', unit: 'K/uL' },
      { name: 'Sodium', loinc: '2951-2', unit: 'mEq/L' },
      { name: 'Potassium', loinc: '6298-4', unit: 'mEq/L' }
    ]
    
    const selectedTest = testDetails[(testNumber - 1) % testDetails.length]
    
    return {
      resourceType: 'Observation',
      id: uuidv4(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      },
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'laboratory',
          display: 'Laboratory'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: selectedTest.loinc,
          display: selectedTest.name
        }]
      },
      subject: {
        reference: `Patient/${this.sessionData.patientId.toLowerCase()}`
      },
      encounter: {
        reference: `Encounter/${this.sessionData.visitNumber.toLowerCase()}`
      },
      effectiveDateTime: addHours(this.sessionData.admitDate, faker.number.int({ min: 2, max: 48 })).toISOString(),
      valueQuantity: {
        value: faker.number.float({ min: 1, max: 200, fractionDigits: 1 }),
        unit: selectedTest.unit,
        system: 'http://unitsofmeasure.org'
      }
    }
  }

  generateFHIRDiagnosticReport(numResults = 1) {
    // Generate ONE DiagnosticReport with multiple observation references
    const observations = []
    for (let i = 0; i < Math.min(numResults, 10); i++) {
      observations.push({
        reference: `Observation/${uuidv4()}`,
        display: faker.helpers.arrayElement(['Glucose', 'Hemoglobin', 'WBC Count', 'Sodium', 'Potassium', 'Hematocrit'])
      })
    }

    return {
      resourceType: 'DiagnosticReport',
      id: uuidv4(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      },
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
          code: 'LAB',
          display: 'Laboratory'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '58410-2',
          display: 'Complete blood count (hemogram) panel'
        }]
      },
      subject: {
        reference: `Patient/${this.sessionData.patientId.toLowerCase()}`
      },
      encounter: {
        reference: `Encounter/${this.sessionData.visitNumber.toLowerCase()}`
      },
      effectiveDateTime: addHours(this.sessionData.admitDate, faker.number.int({ min: 2, max: 48 })).toISOString(),
      issued: new Date().toISOString(),
      performer: [{
        reference: `Practitioner/${this.sessionData.physician.id}`,
        display: `Dr. ${this.sessionData.physician.firstName} ${this.sessionData.physician.lastName}`
      }],
      result: observations
    }
  }

  generateFHIRServiceRequest(numResults = 1) {
    // Generate ONE ServiceRequest for multiple tests (like 1 OBR for multiple OBX)
    return {
      resourceType: 'ServiceRequest',
      id: uuidv4(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      },
      status: 'active',
      intent: 'order',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '58410-2',
          display: `Complete blood count panel (${numResults} tests)`
        }]
      },
      subject: {
        reference: `Patient/${this.sessionData.patientId.toLowerCase()}`
      },
      encounter: {
        reference: `Encounter/${this.sessionData.visitNumber.toLowerCase()}`
      },
      authoredOn: this.sessionData.admitDate.toISOString(),
      requester: {
        reference: `Practitioner/${this.sessionData.physician.id}`,
        display: `Dr. ${this.sessionData.physician.firstName} ${this.sessionData.physician.lastName}`
      },
      note: [{
        text: `Laboratory order requesting ${numResults} specific test results`
      }]
    }
  }

  // ASTM Generators
  generateASTMMessage(recordType, options = {}) {
    const { numResults = 1, numOrders = 1 } = options
    
    switch (recordType) {
      case 'Complete':
        return this.generateCompleteASTMMessage(Math.min(numResults, 10))
      case 'Patient':
        return this.generateASTMPatientRecord()
      case 'Order':
        return this.generateASTMOrderRecord()
      case 'Result':
        return this.generateASTMResultRecord()
      default:
        return this.generateCompleteASTMMessage(1)
    }
  }

  generateCompleteASTMMessage(numResults = 1) {
    let message = this.generateASTMHeader() + '\r'
    message += this.generateASTMPatientRecord() + '\r'
    
    // Generate ONE order (O) with multiple result records (R)
    message += this.generateASTMOrderRecord() + '\r'
    
    // Generate the specified number of result records under this single order
    for (let i = 0; i < Math.min(numResults, 10); i++) {
      message += this.generateASTMResultRecord() + '\r'
    }
    
    message += this.generateASTMTerminator()
    return message
  }

  generateASTMHeader() {
    return `H|\\^&|||${faker.company.name()}|||||LIS||P|1394-97|${this.formatASTMTimestamp(new Date())}`
  }

  generateASTMPatientRecord() {
    const birthDate = this.formatASTMDate(this.sessionData.birthDate)
    return `P|1|||${this.sessionData.patientId}||${this.sessionData.lastName}^${this.sessionData.firstName}||${birthDate}|${this.sessionData.gender}|||||||||||||||`
  }

  generateASTMOrderRecord() {
    const orderNumber = this.getNextOrderNumber()
    const testCode = faker.helpers.arrayElement(['CBC', 'BMP', 'CMP', 'LIPID', 'TSH'])
    
    return `O|1|${orderNumber}||^^^${faker.string.alphanumeric(5)}^${testCode}|R|${this.formatASTMTimestamp(new Date())}|||||N||||${this.sessionData.physician.lastName}||||||||F`
  }

  generateASTMResultRecord() {
    const resultValue = faker.number.float({ min: 1.0, max: 200.0, fractionDigits: 1 })
    const units = faker.helpers.arrayElement(['mg/dL', 'mmol/L', 'IU/L', '%', 'g/dL'])
    const testName = faker.helpers.arrayElement(['Glucose', 'Hemoglobin', 'WBC', 'Sodium', 'Potassium'])
    
    return `R|1|^^^${faker.string.alphanumeric(5)}^${testName}|${resultValue}|${units}|N|N|F||^${this.sessionData.physician.lastName}|${this.formatASTMTimestamp(new Date())}`
  }

  generateASTMTerminator() {
    return `L|1|N`
  }

  // Utility Methods
  formatHL7Timestamp(date) {
    return format(date, 'yyyyMMddHHmmss')
  }

  formatHL7Date(date) {
    return format(date, 'yyyyMMdd')
  }

  formatASTMTimestamp(date) {
    return format(date, 'yyyyMMddHHmmss')
  }

  formatASTMDate(date) {
    return format(date, 'yyyyMMdd')
  }

  getNextMessageControlId() {
    return (this.messageControlId++).toString().padStart(8, '0')
  }

  getNextOrderNumber() {
    return (this.orderSequence++).toString().padStart(8, '0')
  }

  // Preset Templates
  getPresets() {
    return {
      'HL7 v2.x': [
        { value: 'ORU^R01', label: 'Lab Results (ORU^R01)', description: 'Laboratory results with multiple tests' },
        { value: 'OUL^R21', label: 'Microbiology Results (OUL^R21)', description: 'Microbiology/specimen results' },
        { value: 'ADT^A01', label: 'Patient Admission (ADT^A01)', description: 'Hospital admission message' }
      ],
      'C-CDA': [
        { value: 'CCD', label: 'Continuity of Care Document', description: 'Complete patient summary with allergies, medications, and problems' },
        { value: 'LabReport', label: 'Laboratory Report', description: 'C-CDA laboratory results document with multiple test results' },
        { value: 'DischargeSummary', label: 'Discharge Summary', description: 'Hospital discharge summary with course and medications' },
        { value: 'ProgressNote', label: 'Progress Note', description: 'Clinical progress note with assessment and plan' },
        { value: 'ConsultationNote', label: 'Consultation Note', description: 'Specialist consultation with recommendations and findings' },
        { value: 'HistoryAndPhysical', label: 'History and Physical', description: 'Initial H&P examination report with clinical findings' }
      ],
      'FHIR R4/R5': [
        { value: 'Patient', label: 'Patient Resource', description: 'Patient demographic information' },
        { value: 'Encounter', label: 'Encounter Resource', description: 'Healthcare encounter/visit' },
        { value: 'Observation', label: 'Observation Resource', description: 'Lab result or vital sign' },
        { value: 'DiagnosticReport', label: 'Diagnostic Report', description: 'Complete lab report with results' },
        { value: 'ServiceRequest', label: 'Service Request', description: 'Order for lab tests or procedures' }
      ],
      'ASTM': [
        { value: 'Complete', label: 'Complete Message', description: 'Full ASTM message with patient, orders, and results' },
        { value: 'Patient', label: 'Patient Record', description: 'Patient demographics only' },
        { value: 'Order', label: 'Order Record', description: 'Test order information' },
        { value: 'Result', label: 'Result Record', description: 'Individual test result' }
      ]
    }
  }
}