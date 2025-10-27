// Test script for AGI calculation
import * as fg from '../fg.js'
import { readFileSync } from 'fs'

console.log('Loading AGI facts XML...')
const xmlText = readFileSync('./exampleAgiFacts.xml', 'utf-8')

console.log('Creating fact dictionary...')
const factDictionary = fg.FactDictionaryFactory.importFromXml(xmlText)

console.log('Creating graph...')
const factGraph = fg.GraphFactory.apply(factDictionary)

console.log('\nTesting AGI calculation...')
console.log('Setting /totalWages to "50000"')
try {
  factGraph.set('/totalWages', '50000')
  console.log('✓ Successfully set totalWages')
} catch (e) {
  console.log('✗ Error setting totalWages:', e.message)
}

console.log('Setting /totalInterestIncome to "1500"')
try {
  factGraph.set('/totalInterestIncome', '1500')
  console.log('✓ Successfully set totalInterestIncome')
} catch (e) {
  console.log('✗ Error setting totalInterestIncome:', e.message)
}

console.log('Setting /total1099Income to "3000"')
try {
  factGraph.set('/total1099Income', '3000')
  console.log('✓ Successfully set total1099Income')
} catch (e) {
  console.log('✗ Error setting total1099Income:', e.message)
}

console.log('Setting /totalAdjustments to "2000"')
try {
  factGraph.set('/totalAdjustments', '2000')
  console.log('✓ Successfully set totalAdjustments')
} catch (e) {
  console.log('✗ Error setting totalAdjustments:', e.message)
}

console.log('Setting /yearOfBirth to "1990"')
try {
  factGraph.set('/yearOfBirth', '1990')
  console.log('✓ Successfully set yearOfBirth')
} catch (e) {
  console.log('✗ Error setting yearOfBirth:', e.message)
}

console.log('Setting /isUsCitizen to "true"')
try {
  factGraph.set('/isUsCitizen', 'true')
  console.log('✓ Successfully set isUsCitizen')
} catch (e) {
  console.log('✗ Error setting isUsCitizen:', e.message)
}

console.log('\nSaving graph...')
try {
  const saveResult = factGraph.save()
  console.log('✓ Save succeeded, valid:', saveResult.valid)
} catch (e) {
  console.log('✗ Error saving:', e.message)
  process.exit(1)
}

console.log('\nGetting computed values...')
try {
  const agi = factGraph.get('/totalAdjustedGrossIncome')
  console.log('AGI:', agi)

  const age = factGraph.get('/age')
  console.log('Age:', age)

  const eligible = factGraph.get('/eligibleForDirectFile')
  console.log('Eligible:', eligible)

  console.log('\n✓ All tests passed!')
} catch (e) {
  console.log('✗ Error getting values:', e.message)
  console.error(e)
  process.exit(1)
}
