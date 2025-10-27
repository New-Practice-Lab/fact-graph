import * as fg from '../fg.js'

let factGraph

// Load the AGI fact dictionary on page load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch the AGI facts XML file
    const response = await fetch('./exampleAgiFacts.xml')
    const xmlText = await response.text()

    // Initialize the fact dictionary and graph
    const factDictionary = fg.FactDictionaryFactory.importFromXml(xmlText)
    factGraph = fg.GraphFactory.apply(factDictionary)

    console.log('AGI Fact Graph loaded successfully')
    hideError()
  } catch (error) {
    showError('Failed to load fact dictionary: ' + error.message)
    console.error('Error loading fact dictionary:', error)
  }
})

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('agi-form')
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    calculateAGI()
  })
})

function calculateAGI() {
  try {
    hideError()

    // Get form values
    const formData = new FormData(document.getElementById('agi-form'))

    // Helper function to set dollar values (all values must be strings)
    const setDollarFact = (path, value) => {
      try {
        const val = (value && value.trim() !== '') ? value.trim() : '0.00'
        console.log(`Setting ${path} to "${val}" (type: ${typeof val})`)
        factGraph.set(path, val)
        console.log(`✓ Successfully set ${path}`)
      } catch (e) {
        console.error(`✗ Error setting ${path}:`, e.message)
        throw e
      }
    }

    // Set writable facts in the graph (all as strings - JSGraph handles type conversion)
    console.log('Setting facts...')
    const wages = formData.get('totalWages') || '0'
    console.log('Total Wages:', wages, typeof wages)
    setDollarFact('/totalWages', wages)

    const interest = formData.get('totalInterestIncome') || '0'
    console.log('Total Interest:', interest, typeof interest)
    setDollarFact('/totalInterestIncome', interest)

    const income1099 = formData.get('total1099Income') || '0'
    console.log('Total 1099:', income1099, typeof income1099)
    setDollarFact('/total1099Income', income1099)

    const adjustments = formData.get('totalAdjustments') || '0'
    console.log('Total Adjustments:', adjustments, typeof adjustments)
    setDollarFact('/totalAdjustments', adjustments)

    const dateOfBirth = formData.get('dateOfBirth')
    if (dateOfBirth && dateOfBirth.trim() !== '') {
      console.log('Date of Birth:', dateOfBirth, typeof dateOfBirth)
      factGraph.set('/dateOfBirth', dateOfBirth.trim())

      // Extract year from date of birth and set it separately
      // (needed because /age calculation depends on /yearOfBirth in the XML)
      const birthYear = new Date(dateOfBirth).getFullYear()
      console.log('Derived Year of Birth:', birthYear, typeof birthYear)
      factGraph.set('/yearOfBirth', birthYear.toString())
    }

    const isUsCitizen = document.getElementById('isUsCitizen').checked
    console.log('Is US Citizen:', isUsCitizen, typeof isUsCitizen)
    factGraph.set('/isUsCitizen', isUsCitizen ? 'true' : 'false')

    // Note: set() already handles saving/validation, no separate save() call needed

    // Get computed results
    const agiResult = factGraph.get('/totalAdjustedGrossIncome')
    const ageResult = factGraph.get('/age')
    const age16OrOlderResult = factGraph.get('/age16OrOlder')
    const eligibleResult = factGraph.get('/eligibleForDirectFile')

    // Display results
    displayResults({
      agi: extractValue(agiResult),
      age: extractValue(ageResult),
      age16OrOlder: extractValue(age16OrOlderResult),
      eligible: extractValue(eligibleResult)
    })

    // Display graph JSON
    displayGraphJson()

  } catch (error) {
    showError('Error calculating AGI: ' + error.message)
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

  // Display AGI
  const agiElement = document.getElementById('agi-value')
  if (typeof results.agi === 'number' || !isNaN(parseFloat(results.agi))) {
    const agiValue = parseFloat(results.agi)
    agiElement.textContent = formatCurrency(agiValue)

    // Add negative class if AGI is negative
    if (agiValue < 0) {
      agiElement.classList.add('negative')
      agiElement.classList.remove('highlight')
    } else {
      agiElement.classList.remove('negative')
      agiElement.classList.add('highlight')
    }
  } else {
    agiElement.textContent = results.agi
  }

  // Display age
  const ageElement = document.getElementById('age-value')
  ageElement.textContent = results.age !== 'Incomplete' ? results.age : '-'

  // Display age 16 or older
  const age16Element = document.getElementById('age16-value')
  const age16Value = results.age16OrOlder
  if (age16Value === true || age16Value === 'true') {
    age16Element.textContent = 'Yes'
    age16Element.classList.add('boolean-true')
    age16Element.classList.remove('boolean-false')
  } else if (age16Value === false || age16Value === 'false') {
    age16Element.textContent = 'No'
    age16Element.classList.add('boolean-false')
    age16Element.classList.remove('boolean-true')
  } else {
    age16Element.textContent = '-'
    age16Element.classList.remove('boolean-true', 'boolean-false')
  }

  // Display eligibility
  const eligibleElement = document.getElementById('eligible-value')
  const eligibleValue = results.eligible
  if (eligibleValue === true || eligibleValue === 'true') {
    eligibleElement.textContent = 'Yes'
    eligibleElement.classList.add('boolean-true')
    eligibleElement.classList.remove('boolean-false')
  } else if (eligibleValue === false || eligibleValue === 'false') {
    eligibleElement.textContent = 'No'
    eligibleElement.classList.add('boolean-false')
    eligibleElement.classList.remove('boolean-true')
  } else {
    eligibleElement.textContent = '-'
    eligibleElement.classList.remove('boolean-true', 'boolean-false')
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

function showError(message) {
  const errorDiv = document.getElementById('error')
  const errorText = errorDiv.querySelector('.usa-alert__text')
  errorText.textContent = message
  errorDiv.classList.add('show')
  errorDiv.classList.remove('hidden')
}

function hideError() {
  const errorDiv = document.getElementById('error')
  errorDiv.classList.remove('show')
  errorDiv.classList.add('hidden')
}

function resetForm() {
  document.getElementById('agi-form').reset()
  document.getElementById('results').classList.remove('show')
  document.getElementById('graph-json').classList.remove('show')
  hideError()

  // Recreate the graph to clear all data
  if (factGraph) {
    // Reload the XML to create a fresh graph
    fetch('./exampleAgiFacts.xml')
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
