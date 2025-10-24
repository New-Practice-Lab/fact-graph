import * as fg from '../fg.js'

let factGraph

// Load the EITC fact dictionary on page load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch the EITC facts XML file
    const response = await fetch('./eitc-facts.xml')
    const xmlText = await response.text()

    // Initialize the fact dictionary and graph
    const factDictionary = fg.FactDictionaryFactory.importFromXml(xmlText)
    factGraph = fg.GraphFactory.apply(factDictionary)

    console.log('EITC Fact Graph loaded successfully')
    hideError()
  } catch (error) {
    showError('Failed to load fact dictionary: ' + error.message)
    console.error('Error loading fact dictionary:', error)
  }
})

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('eitc-form')
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    checkEligibility()
  })
})

function checkEligibility() {
  try {
    hideError()

    // Get form values
    const formData = new FormData(document.getElementById('eitc-form'))

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

    // Set filing status
    const filingStatus = formData.get('filingStatus')
    if (!filingStatus) {
      showError('Please select a filing status')
      return
    }
    setFact('/filingStatus', filingStatus)

    // Set marital status
    const isMarried = document.getElementById('isMarried').checked
    setFact('/isMarried', isMarried ? 'true' : 'false')

    // Set primary filer age
    const primaryAge = formData.get('primaryFilerAge')
    if (!primaryAge) {
      showError('Please enter your age')
      return
    }
    setFact('/primaryFilerAge', primaryAge)

    // Set primary filer SSN validity
    const primarySSN = document.getElementById('primaryFilerHasValidSSN').checked
    setFact('/primaryFilerHasValidSSN', primarySSN ? 'true' : 'false')

    // Set secondary filer age and SSN if married
    if (isMarried || filingStatus === 'MarriedFilingJointly' || filingStatus === 'MarriedFilingSeparately') {
      const secondaryAge = formData.get('secondaryFilerAge') || '0'
      setFact('/secondaryFilerAge', secondaryAge)

      const secondarySSN = document.getElementById('secondaryFilerHasValidSSN').checked
      setFact('/secondaryFilerHasValidSSN', secondarySSN ? 'true' : 'false')

      const livesSeparate = document.getElementById('livesSeparateFromSpouse').checked
      setFact('/livesSeparateFromSpouse', livesSeparate ? 'true' : 'false')
    } else {
      // Set defaults for non-married filers
      setFact('/secondaryFilerAge', '0')
      setFact('/secondaryFilerHasValidSSN', 'false')
      setFact('/livesSeparateFromSpouse', 'false')
    }

    // Set dependent status
    const canBeDependent = document.getElementById('canBeClaimedAsDependent').checked
    setFact('/canBeClaimedAsDependent', canBeDependent ? 'true' : 'false')

    // Set income values
    const earnedIncome = formData.get('earnedIncome') || '0'
    setFact('/earnedIncome', earnedIncome)

    const agi = formData.get('adjustedGrossIncome') || '0'
    setFact('/adjustedGrossIncome', agi)

    const investmentIncome = formData.get('investmentIncome') || '0'
    setFact('/investmentIncome', investmentIncome)

    // Set number of qualifying children
    const numQC = formData.get('numQualifyingChildren') || '0'
    setFact('/numQualifyingChildren', numQC)

    // Get computed results
    const eitcQualified = factGraph.get('/eitcQualified')
    const failureReason = factGraph.get('/failureReason')
    const ssnCheck = factGraph.get('/filersHaveValidSSNsForEitc')
    const hasEarnedIncome = factGraph.get('/hasEarnedIncome')
    const investmentCheck = factGraph.get('/belowEitcInvestmentIncomeLimit')
    const agiCheck = factGraph.get('/belowEitcAgiLimit')
    const earnedLimitCheck = factGraph.get('/belowEitcEarnedIncomeLimit')
    const incomeLimit = factGraph.get('/eitcIncomeLimit')

    // Display results
    displayResults({
      qualified: extractValue(eitcQualified),
      failureReason: extractValue(failureReason),
      ssnCheck: extractValue(ssnCheck),
      hasEarnedIncome: extractValue(hasEarnedIncome),
      investmentCheck: extractValue(investmentCheck),
      agiCheck: extractValue(agiCheck),
      earnedLimitCheck: extractValue(earnedLimitCheck),
      incomeLimit: extractValue(incomeLimit)
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

  // Display main eligibility result
  const qualified = results.qualified === true || results.qualified === 'true'

  if (qualified) {
    resultCard.className = 'result-card qualified'
    statusIcon.textContent = '✓'
    statusText.innerHTML = '<h3>You are eligible for EITC!</h3>'
    failureReasonDiv.textContent = 'You meet all the requirements for the Earned Income Tax Credit.'
  } else {
    resultCard.className = 'result-card not-qualified'
    statusIcon.textContent = '✗'
    statusText.innerHTML = '<h3>You are not eligible for EITC</h3>'
    failureReasonDiv.textContent = results.failureReason || 'Does not meet EITC requirements'
  }

  // Display detail checks
  displayCheck('ssn-check', results.ssnCheck)
  displayCheck('earned-income-check', results.hasEarnedIncome)
  displayCheck('investment-check', results.investmentCheck)
  displayCheck('agi-check', results.agiCheck)
  displayCheck('earned-limit-check', results.earnedLimitCheck)

  // Display income limit
  const incomeLimitElement = document.getElementById('income-limit-value')
  if (typeof results.incomeLimit === 'number' || !isNaN(parseFloat(results.incomeLimit))) {
    incomeLimitElement.textContent = formatCurrency(parseFloat(results.incomeLimit))
    incomeLimitElement.className = 'detail-value'
  } else {
    incomeLimitElement.textContent = '-'
    incomeLimitElement.className = 'detail-value'
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
  errorDiv.textContent = message
  errorDiv.classList.add('show')
  // Scroll to error
  errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function hideError() {
  const errorDiv = document.getElementById('error')
  errorDiv.classList.remove('show')
}

function resetForm() {
  document.getElementById('eitc-form').reset()
  document.getElementById('results').classList.remove('show')
  document.getElementById('graph-json').classList.remove('show')
  document.getElementById('spouseFields').classList.remove('show')
  hideError()

  // Recreate the graph to clear all data
  if (factGraph) {
    fetch('./eitc-facts.xml')
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
