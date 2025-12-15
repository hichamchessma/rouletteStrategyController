/**
 * Roulette Decision Support System - UI Controller
 * 
 * This file handles all the UI interactions and connects the UI with the business logic.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const maxBetSelect = document.getElementById('max-bet');
    const calculateBtn = document.getElementById('calculate-btn');
    const newNumberInput = document.getElementById('new-number');
    const addNumberBtn = document.getElementById('add-number-btn');
    const randomHistoryBtn = document.getElementById('random-history-btn');
    const generatedNumbersContainer = document.getElementById('generated-numbers');
    
    // Column result elements
    const columnSignalElement = document.getElementById('column-signal');
    const columnAbsenceElement = document.getElementById('column-absence');
    const columnBetElement = document.getElementById('column-bet');
    
    // Tier result elements
    const tierSignalElement = document.getElementById('tier-signal');
    const tierAbsenceElement = document.getElementById('tier-absence');
    const tierBetElement = document.getElementById('tier-bet');
    
    // Tracking elements for columns
    const column1AbsenceElement = document.getElementById('column-1-absence');
    const column2AbsenceElement = document.getElementById('column-2-absence');
    const column3AbsenceElement = document.getElementById('column-3-absence');
    
    // Tracking elements for tiers
    const tier1AbsenceElement = document.getElementById('tier-1-absence');
    const tier2AbsenceElement = document.getElementById('tier-2-absence');
    const tier3AbsenceElement = document.getElementById('tier-3-absence');
    
    // Current history of numbers (most recent first)
    let currentHistory = [];
    
    /**
     * Clears all input fields and results
     */
    function clearAll() {
        // Clear new number input
        newNumberInput.value = '';
        newNumberInput.classList.remove('error');
        
        // Clear generated numbers display
        generatedNumbersContainer.innerHTML = '';
        currentHistory = [];
        
        // Reset results
        columnSignalElement.textContent = 'Pas encore';
        columnAbsenceElement.textContent = '-';
        columnBetElement.textContent = '-';
        
        tierSignalElement.textContent = 'Pas encore';
        tierAbsenceElement.textContent = '-';
        tierBetElement.textContent = '-';
        
        // Reset tracking for columns
        column1AbsenceElement.textContent = '0';
        column2AbsenceElement.textContent = '0';
        column3AbsenceElement.textContent = '0';
        
        // Reset tracking for tiers
        tier1AbsenceElement.textContent = '0';
        tier2AbsenceElement.textContent = '0';
        tier3AbsenceElement.textContent = '0';
        
        // Remove any error messages
        const errorMsg = document.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    }
    
    // Display functions are now handled directly in calculateNextBet
    
    /**
     * Displays the generated numbers in the dedicated area
     * @param {Array} numbers - Array of numbers to display
     */
    function displayGeneratedNumbers(numbers) {
        // Clear previous numbers
        generatedNumbersContainer.innerHTML = '';
        
        // Create and append number elements
        numbers.forEach((num, index) => {
            const numElement = document.createElement('div');
            numElement.className = 'generated-number';
            numElement.textContent = num;
            
            // Add a data attribute for the position (most recent = 0)
            numElement.dataset.position = index;
            
            generatedNumbersContainer.appendChild(numElement);
        });
        
        // Scroll to the beginning (most recent numbers) if there are many numbers
        generatedNumbersContainer.scrollLeft = 0;
    }
    
    /**
     * Validates the input fields and returns the numbers array
     * @returns {Array|null} Array of numbers or null if invalid
     */
    function getInputNumbers() {
        // Remove any previous error messages
        const prevError = document.querySelector('.error-message');
        if (prevError) {
            prevError.remove();
        }
        
        // Reset error styling
        numberInputs.forEach(input => {
            input.classList.remove('error');
        });
        
        // Collect non-empty inputs in order by data-index
        const numbersMap = new Map();
        let hasError = false;
        
        numberInputs.forEach(input => {
            if (input.value.trim() !== '') {
                const num = parseInt(input.value);
                const index = parseInt(input.dataset.index);
                
                // Validate number range
                if (isNaN(num) || num < 0 || num > 36) {
                    input.classList.add('error');
                    hasError = true;
                } else {
                    numbersMap.set(index, num);
                }
            }
        });
        
        // Convert map to array preserving order
        const numbers = Array.from(numbersMap)
            .sort((a, b) => a[0] - b[0])
            .map(item => item[1]);
        
        // Check if we have enough numbers
        if (numbers.length < 5) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Veuillez entrer au moins 5 numéros';
            document.querySelector('.number-inputs').after(errorMsg);
            return null;
        }
        
        // Check for errors
        if (hasError) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Les numéros doivent être entre 0 et 36';
            document.querySelector('.number-inputs').after(errorMsg);
            return null;
        }
        
        return numbers;
    }
    
    /**
     * Displays the analysis results in the UI
     * @param {Object} result - The analysis result
     */
    function displayResults(result) {
        if (result.error) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = result.error;
            document.querySelector('.number-inputs').after(errorMsg);
            return;
        }
        
        signalTypeElement.textContent = result.signalType;
        targetElement.textContent = result.target;
        absenceElement.textContent = `${result.absence} spins`;
        
        if (result.betSeries && result.betSeries.length > 0) {
            betSeriesElement.textContent = result.betSeries.join(' → ');
            nextBetElement.textContent = `${result.nextBet} sur ${result.target}`;
        } else {
            betSeriesElement.textContent = '-';
            nextBetElement.textContent = '-';
        }
    }
    
    /**
     * Adds a new number to the history and shifts all existing numbers
     * @param {number} newNum - The new number to add
     */
    function addNewNumber(newNum) {
        // Remove any previous error messages
        const prevError = document.querySelector('.error-message');
        if (prevError) {
            prevError.remove();
        }
        
        // Validate the new number
        if (isNaN(newNum) || newNum < 0 || newNum > 36) {
            newNumberInput.classList.add('error');
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Le numéro doit être entre 0 et 36';
            document.querySelector('.new-number-input').after(errorMsg);
            return;
        }
        
        // Add the new number at the beginning (left side)
        currentHistory.unshift(newNum);
        
        // Keep only the last 30 numbers if needed
        if (currentHistory.length > 30) {
            currentHistory = currentHistory.slice(0, 30);
        }
        
        // Display the numbers in the generated numbers area
        displayGeneratedNumbers(currentHistory);
        
        // Clear the new number input
        newNumberInput.value = '';
        
        // Always call calculateNextBet which will handle both tracking and signals
        calculateNextBet();
    }
    
    /**
     * Generates a random history of 10 roulette numbers
     */
    function generateRandomHistory() {
        // Remove any previous error messages
        const prevError = document.querySelector('.error-message');
        if (prevError) {
            prevError.remove();
        }
        
        // Clear current history
        currentHistory = [];
        
        // Generate 10 random numbers between 0 and 36
        for (let i = 0; i < 10; i++) {
            const randomNum = Math.floor(Math.random() * 37); // 0-36
            currentHistory.push(randomNum);
        }
        
        // Display the generated numbers
        displayGeneratedNumbers(currentHistory);
        
        // Calculate bets based on the random history
        calculateNextBet();
    }
    
    /**
     * Calculates the next bet based on the current history
     */
    function calculateNextBet() {
        // Remove any previous error messages
        const prevError = document.querySelector('.error-message');
        if (prevError) {
            prevError.remove();
        }
        
        // Always update the tracking display even if we don't have enough numbers
        const absences = detectAbsence(currentHistory);
        
        // Update tracking for columns
        column1AbsenceElement.textContent = absences.columns[1];
        column2AbsenceElement.textContent = absences.columns[2];
        column3AbsenceElement.textContent = absences.columns[3];
        
        // Update tracking for tiers
        tier1AbsenceElement.textContent = absences.tiers[1];
        tier2AbsenceElement.textContent = absences.tiers[2];
        tier3AbsenceElement.textContent = absences.tiers[3];
        
        if (currentHistory.length < 5) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Veuillez entrer au moins 5 numéros';
            document.querySelector('.new-number-section').after(errorMsg);
            return;
        }
        
        const maxBet = parseInt(maxBetSelect.value);
        const result = analyzeRouletteHistory(currentHistory, maxBet);
        
        // Debug output to console
        console.log('Current History:', currentHistory);
        console.log('Analysis Result:', result);
        
        // Display the results
        try {
            // Display column results
            const columnResult = result.column;
            if (!columnResult || columnResult.signalType === 'AUCUN') {
                columnSignalElement.textContent = 'Pas encore';
                columnAbsenceElement.textContent = '-';
                columnBetElement.textContent = '-';
            } else {
                columnSignalElement.textContent = `COLUMN ${columnResult.target}`;
                columnAbsenceElement.textContent = `${columnResult.absence} spins`;
                columnBetElement.textContent = `${columnResult.nextBet} sur COLUMN ${columnResult.target}`;
            }
            
            // Display tier results
            const tierResult = result.tier;
            if (!tierResult || tierResult.signalType === 'AUCUN') {
                tierSignalElement.textContent = 'Pas encore';
                tierAbsenceElement.textContent = '-';
                tierBetElement.textContent = '-';
            } else {
                tierSignalElement.textContent = `TIER ${tierResult.target}`;
                tierAbsenceElement.textContent = `${tierResult.absence} spins`;
                tierBetElement.textContent = `${tierResult.nextBet} sur TIER ${tierResult.target}`;
            }
        } catch (error) {
            console.error('Error displaying results:', error);
        }
    }
    
    // Event Listeners
    calculateBtn.addEventListener('click', calculateNextBet);
    
    // Add new number button
    addNumberBtn.addEventListener('click', () => {
        const newNum = parseInt(newNumberInput.value);
        if (!isNaN(newNum)) {
            addNewNumber(newNum);
        } else {
            newNumberInput.classList.add('error');
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Veuillez entrer un numéro valide';
            document.querySelector('.new-number-input').after(errorMsg);
        }
    });
    
    // Generate random history button
    randomHistoryBtn.addEventListener('click', generateRandomHistory);
    
    // Add input validation for new number field
    newNumberInput.addEventListener('input', function() {
        // Remove non-numeric characters
        this.value = this.value.replace(/[^0-9]/g, '');
        
        // Limit to 2 digits
        if (this.value.length > 2) {
            this.value = this.value.slice(0, 2);
        }
        
        // Ensure value is within range
        const num = parseInt(this.value);
        if (!isNaN(num) && num > 36) {
            this.value = '36';
        }
        
        // Remove error class when typing
        this.classList.remove('error');
    });
});
