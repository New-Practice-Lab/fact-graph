import * as fg from '../fg.js'

let factGraph

/**
 * Combines multiple FactDictionaryModule XML files into a single FactDictionary XML string.
 * Takes the Meta from the first file and merges all Facts sections.
 * Converts FactDictionaryModule root elements to FactDictionary for compatibility.
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

  // Change root element from FactDictionaryModule to FactDictionary
  const root = baseDoc.documentElement
  if (root.tagName === 'FactDictionaryModule') {
    const newRoot = baseDoc.createElement('FactDictionary')
    // Copy all children from old root to new root
    while (root.firstChild) {
      newRoot.appendChild(root.firstChild)
    }
    // Replace the root element
    baseDoc.replaceChild(newRoot, root)
  }

  // Serialize back to XML string
  const serializer = new XMLSerializer()
  return serializer.serializeToString(baseDoc)
}

// Load the Credit Calculator fact dictionary on page load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch multiple fact dictionary XML files
    const [demographicsResponse, eitcResponse, ctcResponse, mdEitcResponse] = await Promise.all([
      fetch('./facts/credit-calc.xml'),      // Shared demographics
      fetch('./facts/federal-eitc.xml'),     // EITC-specific facts
      fetch('./facts/federal-ctc.xml'),      // CTC-specific facts
      fetch('./facts/md-eitc.xml')           // Maryland EITC-specific facts
    ])

    const [demographicsXml, eitcXml, ctcXml, mdEitcXml] = await Promise.all([
      demographicsResponse.text(),
      eitcResponse.text(),
      ctcResponse.text(),
      mdEitcResponse.text()
    ])

    // Combine the XML files
    const combinedXml = combineFactDictionaries(demographicsXml, eitcXml, ctcXml, mdEitcXml)

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
    const mdEitcIdCheck = factGraph.get('/filersHaveValidIdsForMdEitc')
    const eitcIncomeLimit = factGraph.get('/eitcIncomeLimit')
    const federalEitcMaxAmount = factGraph.get('/federalEitcMaxAmount')
    const federalCtcMaxRefundableAmount = factGraph.get('/federalCtcMaxRefundableAmount')
    const mdEitcAmount = factGraph.get('/mdEitcAmount')

    // Note: AGI is currently hardcoded to $25,000 in the fact dictionary
    // When we add AGI as a writable field, we'll check against it
    const adjustedGrossIncome = factGraph.get('/adjustedGrossIncome')

    // Display results
    displayResults({
      filingState: filingState,
      fedEitcIdCheck: extractValue(fedEitcIdCheck),
      fedCtcIdCheck: extractValue(fedCtcIdCheck),
      mdEitcIdCheck: extractValue(mdEitcIdCheck),
      eitcIncomeLimit: extractValue(eitcIncomeLimit),
      adjustedGrossIncome: extractValue(adjustedGrossIncome),
      federalEitcMaxAmount: extractValue(federalEitcMaxAmount),
      federalCtcMaxRefundableAmount: extractValue(federalCtcMaxRefundableAmount),
      mdEitcAmount: extractValue(mdEitcAmount)
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
  const mdEitcPass = results.mdEitcIdCheck === true || results.mdEitcIdCheck === 'true'

  // Display the federal EITC and CTC max amounts
  const eitcAmount = typeof results.federalEitcMaxAmount === 'number' ? results.federalEitcMaxAmount : parseFloat(results.federalEitcMaxAmount) || 0
  const ctcAmount = typeof results.federalCtcMaxRefundableAmount === 'number' ? results.federalCtcMaxRefundableAmount : parseFloat(results.federalCtcMaxRefundableAmount) || 0
  const mdEitcAmount = typeof results.mdEitcAmount === 'number' ? results.mdEitcAmount : parseFloat(results.mdEitcAmount) || 0

  // Check if any credits qualify
  const anyCreditsQualify = fedEitcPass || fedCtcPass || (results.filingState === 'MD' && mdEitcPass)

  if (anyCreditsQualify) {
    resultCard.className = 'result-card qualified'
    statusIcon.textContent = '✓'
    statusText.innerHTML = ''

    // Display max credit amounts
    const creditParts = []
    if (eitcAmount > 0) {
      creditParts.push(`Federal EITC: ${formatCurrency(eitcAmount)}`)
    }
    if (ctcAmount > 0) {
      creditParts.push(`Federal Refundable CTC: ${formatCurrency(ctcAmount)}`)
    }

    // Display Maryland EITC if Maryland is selected and eligible
    if (results.filingState === 'MD' && mdEitcAmount > 0) {
      creditParts.push(`Maryland EITC: ${formatCurrency(mdEitcAmount)}`)
    }

    if (creditParts.length > 0) {
      creditAmountDiv.innerHTML = creditParts.join('<br>')
    } else {
      creditAmountDiv.textContent = ''
    }

    // Add special note for ITIN holders in Maryland
    let noteText = 'Note: Additional eligibility criteria apply.'
    if (results.filingState === 'MD' && mdEitcPass && !fedEitcPass) {
      noteText += ' ITIN holders qualify for Maryland EITC but not Federal EITC.'
    }
    failureReasonDiv.textContent = noteText
  } else {
    resultCard.className = 'result-card not-qualified'
    statusIcon.textContent = '✗'
    statusText.innerHTML = ''
    creditAmountDiv.textContent = formatCurrency(0)
    failureReasonDiv.textContent = 'Based on your tax ID type and filing status, you do not meet the preliminary requirements for these credits.'
  }

  // Display detail checks
  displayCheck('fed-eitc-id-check', results.fedEitcIdCheck)
  displayCheck('fed-ctc-id-check', results.fedCtcIdCheck)

  // Show/hide and display Maryland EITC check based on selected state
  const mdEitcCheckItem = document.getElementById('md-eitc-id-check-item')
  if (results.filingState === 'MD') {
    mdEitcCheckItem.style.display = 'block'
    displayCheck('md-eitc-id-check', results.mdEitcIdCheck)
  } else {
    mdEitcCheckItem.style.display = 'none'
  }
}

function displayCheck(elementId, value) {
  const element = document.getElementById(elementId)
  const boolValue = value === true || value === 'true'

  if (boolValue) {
    element.textContent = 'Eligible ✓'
    element.className = 'detail-value pass'
  } else if (value === false || value === 'false') {
    element.textContent = 'Ineligible ✗'
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
      fetch('./facts/federal-ctc.xml'),
      fetch('./facts/md-eitc.xml')
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
