import * as fg from '../fg.js'

let factGraph

// Load the dinner check fact dictionary on page load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch the dinner check facts XML file
    const response = await fetch('./dinner-check-facts.xml')
    const xmlText = await response.text()

    // Initialize the fact dictionary and graph
    const factDictionary = fg.FactDictionaryFactory.importFromXml(xmlText)
    factGraph = fg.GraphFactory.apply(factDictionary)

    console.log('Dinner Check Fact Graph loaded successfully')
    hideError()
  } catch (error) {
    showError('Failed to load fact dictionary: ' + error.message)
    console.error('Error loading fact dictionary:', error)
  }
})

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('dinner-form')
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    calculateShare()
  })
})

function calculateShare() {
  try {
    hideError()

    // Get form values
    const formData = new FormData(document.getElementById('dinner-form'))

    // Set bill amount
    const totalBill = formData.get('totalBill')
    if (totalBill && totalBill.trim() !== '') {
      console.log('Setting /totalBill to', totalBill)
      factGraph.set('/totalBill', totalBill.trim())
    }

    // Set number of people
    const numPeople = formData.get('numPeople')
    if (numPeople && numPeople.trim() !== '') {
      console.log('Setting /numPeople to', numPeople)
      factGraph.set('/numPeople', numPeople.trim())
    }

    // Set whether it's the user's birthday
    const isYourBirthday = document.getElementById('isYourBirthday').checked
    console.log('Setting /isYourBirthday to', isYourBirthday)
    factGraph.set('/isYourBirthday', isYourBirthday ? 'true' : 'false')

    // Set number of OTHER people celebrating birthdays
    const otherBirthdayPeople = formData.get('otherBirthdayPeople') || '0'
    console.log('Setting /otherBirthdayPeople to', otherBirthdayPeople)
    factGraph.set('/otherBirthdayPeople', otherBirthdayPeople.trim())

    // Get computed results
    const userShareResult = factGraph.get('/userShare')
    const perPersonResult = factGraph.get('/perPersonShare')
    const payingPeopleResult = factGraph.get('/numPayingPeople')
    const isBirthdayResult = factGraph.get('/isYourBirthday')
    const amountSavedResult = factGraph.get('/amountSaved')
    const messageResult = factGraph.get('/birthdayMessage')

    // Display results
    displayResults({
      userShare: extractValue(userShareResult),
      perPerson: extractValue(perPersonResult),
      payingPeople: extractValue(payingPeopleResult),
      isBirthday: extractValue(isBirthdayResult),
      amountSaved: extractValue(amountSavedResult),
      message: extractValue(messageResult)
    })

    // Display graph JSON
    displayGraphJson()

  } catch (error) {
    showError('Error calculating share: ' + error.message)
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

  // Display user's share
  const userShareElement = document.getElementById('user-share-amount')
  const resultCard = document.getElementById('result-card')

  if (typeof results.userShare === 'number' || !isNaN(parseFloat(results.userShare))) {
    const shareValue = parseFloat(results.userShare)
    userShareElement.textContent = formatCurrency(shareValue)

    // Change card style if it's their birthday
    if (results.isBirthday === true) {
      resultCard.classList.add('birthday-card')
      document.querySelector('.emoji').textContent = '🎉'
    } else {
      resultCard.classList.remove('birthday-card')
      document.querySelector('.emoji').textContent = '💰'
    }
  } else {
    userShareElement.textContent = results.userShare
  }

  // Display message
  const messageElement = document.getElementById('birthday-message')
  messageElement.textContent = results.message || 'Split the bill evenly'

  // Display per-person amount
  const perPersonElement = document.getElementById('per-person-value')
  if (typeof results.perPerson === 'number' || !isNaN(parseFloat(results.perPerson))) {
    perPersonElement.textContent = formatCurrency(parseFloat(results.perPerson))
  } else {
    perPersonElement.textContent = results.perPerson
  }

  // Display number of paying people
  const payingPeopleElement = document.getElementById('paying-people-value')
  payingPeopleElement.textContent = results.payingPeople || '0'

  // Display birthday status
  const isBirthdayElement = document.getElementById('is-birthday-value')
  if (results.isBirthday === true) {
    isBirthdayElement.textContent = '🎂 Yes! Happy Birthday!'
    isBirthdayElement.classList.add('success')
  } else {
    isBirthdayElement.textContent = 'No'
    isBirthdayElement.classList.remove('success')
  }

  // Display amount saved (only if it's their birthday)
  const savingsItem = document.getElementById('savings-item')
  const amountSavedElement = document.getElementById('amount-saved-value')
  if (results.isBirthday === true && parseFloat(results.amountSaved) > 0) {
    savingsItem.style.display = 'flex'
    amountSavedElement.textContent = formatCurrency(parseFloat(results.amountSaved))
  } else {
    savingsItem.style.display = 'none'
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
  errorDiv.textContent = message
  errorDiv.classList.add('show')
}

function hideError() {
  const errorDiv = document.getElementById('error')
  errorDiv.classList.remove('show')
}

function resetForm() {
  document.getElementById('dinner-form').reset()
  document.getElementById('results').classList.remove('show')
  document.getElementById('graph-json').classList.remove('show')
  hideError()

  // Recreate the graph to clear all data
  if (factGraph) {
    fetch('./dinner-check-facts.xml')
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
