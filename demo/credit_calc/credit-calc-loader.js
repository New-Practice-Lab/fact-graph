import * as fg from '../fg.js'

let factGraph

// Load the Credit Calculator fact dictionary on page load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch the credit-calc facts XML file
    const response = await fetch('./credit-calc-facts.xml')
    const xmlText = await response.text()

    // Initialize the fact dictionary and graph
    const factDictionary = fg.FactDictionaryFactory.importFromXml(xmlText)
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

    // Note: AGI is currently hardcoded to $25,000 in the fact dictionary
    // When we add AGI as a writable field, we'll check against it
    const adjustedGrossIncome = factGraph.get('/adjustedGrossIncome')

    // Display results
    displayResults({
      fedEitcIdCheck: extractValue(fedEitcIdCheck),
      fedCtcIdCheck: extractValue(fedCtcIdCheck),
      eitcIncomeLimit: extractValue(eitcIncomeLimit),
      adjustedGrossIncome: extractValue(adjustedGrossIncome)
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
  const failureReasonDiv = document.getElementById('failure-reason')

  // Display main result
  // For now, we'll show a summary based on the checks
  const fedEitcPass = results.fedEitcIdCheck === true || results.fedEitcIdCheck === 'true'
  const fedCtcPass = results.fedCtcIdCheck === true || results.fedCtcIdCheck === 'true'

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
    failureReasonDiv.textContent = 'Note: Additional eligibility criteria apply. This is a preliminary check based on tax ID requirements.'
  } else {
    resultCard.className = 'result-card not-qualified'
    statusIcon.textContent = '✗'
    statusText.innerHTML = '<h3>Tax ID Requirements Not Met</h3>'
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
    fetch('./credit-calc-facts.xml')
      .then(response => response.text())
      .then(xmlText => {
        const factDictionary = fg.FactDictionaryFactory.importFromXml(xmlText)
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
