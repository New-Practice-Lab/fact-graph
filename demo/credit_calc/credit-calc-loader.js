import * as fg from '../fg.js'

let factGraph

/**
 * Combines multiple fact dictionary XML files into a single XML string.
 * Takes the Meta from the first file and merges all Facts sections.
 */
function combineFactDictionaries(...xmlStrings) {
  const parser = new DOMParser()

  // Parse the first XML to get the base structure
  const baseDoc = parser.parseFromString(xmlStrings[0], 'text/xml')
  const baseFacts = baseDoc.querySelector('Facts')

  // Extract facts from all additional XML files
  for (let i = 1; i < xmlStrings.length; i++) {
    const doc = parser.parseFromString(xmlStrings[i], 'text/xml')
    const facts = doc.querySelectorAll('Facts > Fact')

    // Append each fact to the base Facts section
    facts.forEach(fact => {
      baseFacts.appendChild(fact.cloneNode(true))
    })
  }

  // Serialize back to XML string
  const serializer = new XMLSerializer()
  return serializer.serializeToString(baseDoc)
}

// Load the Credit Calculator fact dictionary on page load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch multiple fact dictionary XML files
    const [demographicsResponse, eitcResponse, ctcResponse] = await Promise.all([
      fetch('./facts/credit-calc.xml'),      // Shared demographics
      fetch('./facts/federal-eitc.xml'),     // EITC-specific facts
      fetch('./facts/federal-ctc.xml')       // CTC-specific facts
    ])

    const [demographicsXml, eitcXml, ctcXml] = await Promise.all([
      demographicsResponse.text(),
      eitcResponse.text(),
      ctcResponse.text()
    ])

    // Combine the XML files
    const combinedXml = combineFactDictionaries(demographicsXml, eitcXml, ctcXml)

    // Initialize the fact dictionary and graph
    const factDictionary = fg.FactDictionaryFactory.importFromXml(combinedXml)
    factGraph = fg.GraphFactory.apply(factDictionary)

    console.log('Credit Calculator Fact Graph loaded successfully')
    hideError()
  } catch (error) {
    showError('Failed to load fact dictionary: ' + error.message)
    console.error('Error loading fact dictionary:', error)
  }
})

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('credit-calc-form')
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    checkEligibility()
  })
})

function checkEligibility() {
  try {
    hideError()

    // Get form values
    const formData = new FormData(document.getElementById('credit-calc-form'))

    // Helper function to set values
    const setFact = (path, value) => {
      try {
        console.log(`Setting ${path} to "${value}"`)
        factGraph.set(path, value)
        console.log(`✓ Successfully set ${path}`)
      } catch (e) {
        console.error(`✗ Error setting ${path}:`, e.message)
        throw e
      }
    }

    // Set filing state
    const filingState = formData.get('filingState')
    if (!filingState) {
      showError('Please select a state')
      return
    }
    setFact('/filingState', filingState)

    // Set filing status
    const filingStatus = formData.get('filingStatus')
    if (!filingStatus) {
      showError('Please select a filing status')
      return
    }
    setFact('/filingStatus', filingStatus)

    // Set primary filer tax ID
    const primaryTaxId = formData.get('primaryFilerTaxId')
    if (!primaryTaxId) {
      showError('Please select your tax ID type')
      return
    }
    setFact('/primaryFilerTaxId', primaryTaxId)

    // Set secondary filer tax ID if married filing jointly
    if (filingStatus === 'MarriedFilingJointly') {
      const secondaryTaxId = formData.get('secondaryFilerTaxId') || 'Neither'
      setFact('/secondaryFilerTaxId', secondaryTaxId)
    } else {
      // Set default for non-MFJ filers
      setFact('/secondaryFilerTaxId', 'Neither')
    }

    // Set number of qualifying children
    const numQC = formData.get('numQualifyingChildren') || '0'
    setFact('/numQualifyingChildren', numQC)

    // Get computed results
    const fedEitcIdCheck = factGraph.get('/filersHaveValidIdsForFederalEitc')
    const fedCtcIdCheck = factGraph.get('/filersHaveValidIdsForFederalCtc')
    const eitcIncomeLimit = factGraph.get('/eitcIncomeLimit')
    const federalEitcMaxAmount = factGraph.get('/federalEitcMaxAmount')
    const federalCtcMaxRefundableAmount = factGraph.get('/federalCtcMaxRefundableAmount')

    // Note: AGI is currently hardcoded to $25,000 in the fact dictionary
    // When we add AGI as a writable field, we'll check against it
    const adjustedGrossIncome = factGraph.get('/adjustedGrossIncome')

    // Display results
    displayResults({
      fedEitcIdCheck: extractValue(fedEitcIdCheck),
      fedCtcIdCheck: extractValue(fedCtcIdCheck),
      eitcIncomeLimit: extractValue(eitcIncomeLimit),
      adjustedGrossIncome: extractValue(adjustedGrossIncome),
      federalEitcMaxAmount: extractValue(federalEitcMaxAmount),
      federalCtcMaxRefundableAmount: extractValue(federalCtcMaxRefundableAmount)
    })

    // Display graph JSON
    displayGraphJson()

  } catch (error) {
    showError('Error checking eligibility: ' + error.message)
    console.error('Error:', error)
  }
}

function extractValue(result) {
  // Handle different result types
  if (result === null || result === undefined) {
    return 'Incomplete'
  }

  // Try to get the value from various possible properties
  if (result.v !== undefined) {
    return result.v
  }

  if (result.get !== undefined) {
    return result.get
  }

  if (typeof result === 'object' && result.value !== undefined) {
    return result.value
  }

  return result
}

function displayResults(results) {
  // Show results container
  document.getElementById('results').classList.add('show')

  const resultCard = document.getElementById('result-card')
  const statusIcon = document.getElementById('status-icon')
  const statusText = document.getElementById('status-text')
  const creditAmountDiv = document.getElementById('credit-amount')
  const failureReasonDiv = document.getElementById('failure-reason')

  // Display main result
  // For now, we'll show a summary based on the checks
  const fedEitcPass = results.fedEitcIdCheck === true || results.fedEitcIdCheck === 'true'
  const fedCtcPass = results.fedCtcIdCheck === true || results.fedCtcIdCheck === 'true'

  // Display the federal EITC and CTC max amounts
  const eitcAmount = typeof results.federalEitcMaxAmount === 'number' ? results.federalEitcMaxAmount : parseFloat(results.federalEitcMaxAmount) || 0
  const ctcAmount = typeof results.federalCtcMaxRefundableAmount === 'number' ? results.federalCtcMaxRefundableAmount : parseFloat(results.federalCtcMaxRefundableAmount) || 0

  if (fedEitcPass || fedCtcPass) {
    resultCard.className = 'result-card qualified'
    statusIcon.textContent = '✓'
    let message = '<h3>Preliminary Tax ID Checks Passed!</h3>'
    if (fedEitcPass && fedCtcPass) {
      message = '<h3>You may qualify for both EITC and CTC!</h3>'
    } else if (fedEitcPass) {
      message = '<h3>You may qualify for EITC!</h3>'
    } else if (fedCtcPass) {
      message = '<h3>You may qualify for CTC!</h3>'
    }
    statusText.innerHTML = message

    // Display max credit amounts
    const creditParts = []
    if (eitcAmount > 0) {
      creditParts.push(`Federal EITC: ${formatCurrency(eitcAmount)}`)
    }
    if (ctcAmount > 0) {
      creditParts.push(`Federal Refundable CTC: ${formatCurrency(ctcAmount)}`)
    }

    if (creditParts.length > 0) {
      creditAmountDiv.innerHTML = creditParts.join('<br>')
    } else {
      creditAmountDiv.textContent = ''
    }

    failureReasonDiv.textContent = 'Note: Additional eligibility criteria apply. This is a preliminary check based on tax ID requirements.'
  } else {
    resultCard.className = 'result-card not-qualified'
    statusIcon.textContent = '✗'
    statusText.innerHTML = '<h3>Tax ID Requirements Not Met</h3>'
    creditAmountDiv.textContent = formatCurrency(0)
    failureReasonDiv.textContent = 'Based on your tax ID type and filing status, you do not meet the preliminary requirements for these credits.'
  }

  // Display detail checks
  displayCheck('fed-eitc-id-check', results.fedEitcIdCheck)
  displayCheck('fed-ctc-id-check', results.fedCtcIdCheck)

  // Display income limit
  const incomeLimitElement = document.getElementById('eitc-income-limit')
  if (typeof results.eitcIncomeLimit === 'number' || !isNaN(parseFloat(results.eitcIncomeLimit))) {
    incomeLimitElement.textContent = formatCurrency(parseFloat(results.eitcIncomeLimit))
    incomeLimitElement.className = 'detail-value'
  } else {
    incomeLimitElement.textContent = '-'
    incomeLimitElement.className = 'detail-value'
  }

  // Display AGI check (comparing hardcoded $25k AGI to limit)
  const agiCheckElement = document.getElementById('eitc-agi-check')
  if (typeof results.adjustedGrossIncome === 'number' && typeof results.eitcIncomeLimit === 'number') {
    const belowLimit = results.adjustedGrossIncome < results.eitcIncomeLimit
    displayCheck('eitc-agi-check', belowLimit)
  } else if (!isNaN(parseFloat(results.adjustedGrossIncome)) && !isNaN(parseFloat(results.eitcIncomeLimit))) {
    const belowLimit = parseFloat(results.adjustedGrossIncome) < parseFloat(results.eitcIncomeLimit)
    displayCheck('eitc-agi-check', belowLimit)
  } else {
    agiCheckElement.textContent = `AGI: ${formatCurrency(25000)}`
    agiCheckElement.className = 'detail-value'
  }
}

function displayCheck(elementId, value) {
  const element = document.getElementById(elementId)
  const boolValue = value === true || value === 'true'

  if (boolValue) {
    element.textContent = 'Pass ✓'
    element.className = 'detail-value pass'
  } else if (value === false || value === 'false') {
    element.textContent = 'Fail ✗'
    element.className = 'detail-value fail'
  } else {
    element.textContent = '-'
    element.className = 'detail-value'
  }
}

function displayGraphJson() {
  try {
    const json = factGraph.toJSON()
    const prettyJson = JSON.stringify(JSON.parse(json), null, 2)
    document.getElementById('graph-json-content').textContent = prettyJson
  } catch (error) {
    console.error('Error displaying graph JSON:', error)
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function showError(message) {
  const errorDiv = document.getElementById('error')
  const errorText = errorDiv.querySelector('.usa-alert__text')
  errorText.textContent = message
  errorDiv.classList.add('show')
  errorDiv.classList.remove('hidden')
  // Scroll to error
  errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function hideError() {
  const errorDiv = document.getElementById('error')
  errorDiv.classList.remove('show')
  errorDiv.classList.add('hidden')
}

function resetForm() {
  document.getElementById('credit-calc-form').reset()
  document.getElementById('results').classList.remove('show')
  document.getElementById('graph-json').classList.remove('show')
  document.getElementById('spouseFields').classList.remove('show')
  hideError()

  // Recreate the graph to clear all data
  if (factGraph) {
    Promise.all([
      fetch('./facts/credit-calc.xml'),
      fetch('./facts/federal-eitc.xml'),
      fetch('./facts/federal-ctc.xml')
    ])
      .then(responses => Promise.all(responses.map(r => r.text())))
      .then(xmlTexts => {
        const combinedXml = combineFactDictionaries(...xmlTexts)
        const factDictionary = fg.FactDictionaryFactory.importFromXml(combinedXml)
        factGraph = fg.GraphFactory.apply(factDictionary)
      })
      .catch(error => {
        console.error('Error resetting graph:', error)
      })
  }
}

function toggleGraphJson() {
  const graphJsonDiv = document.getElementById('graph-json')
  graphJsonDiv.classList.toggle('show')
}

// Make functions available globally
window.resetForm = resetForm
window.toggleGraphJson = toggleGraphJson
