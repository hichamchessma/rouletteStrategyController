/**
 * Roulette Decision Support System - Core Logic
 * 
 * This file contains all the business logic for analyzing roulette numbers
 * and generating betting recommendations based on the defined strategy.
 */

// Constants for the betting series
const DEFAULT_BET_SERIES = [1, 1, 1, 2, 3, 5, 8, 12, 18, 27, 41, 60, 100];

// Track the current bet index for each column and tier
let betIndices = {
    columns: { 1: 0, 2: 0, 3: 0 },
    tiers: { 1: 0, 2: 0, 3: 0 }
};

// Track if a signal has been hit (won)
let signalHits = {
    columns: { 1: false, 2: false, 3: false },
    tiers: { 1: false, 2: false, 3: false }
};

/**
 * Classifies a number into its Column and Tier
 * @param {number} num - The roulette number (0-36)
 * @returns {Object} Object containing column and tier classification
 */
function classifyNumber(num) {
    // Handle 0 as a special case
    if (num === 0) {
        return { column: null, tier: null };
    }
    
    // Définition en dur des colonnes (colonnes verticales sur le tapis)
    const column1 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
    const column2 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
    const column3 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
    
    // Définition en dur des tiers
    const tier1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const tier2 = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    const tier3 = [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36];
    
    // Déterminer la colonne
    let column = null;
    if (column1.includes(num)) column = 1;
    else if (column2.includes(num)) column = 2;
    else if (column3.includes(num)) column = 3;
    
    // Déterminer le tier
    let tier = null;
    if (tier1.includes(num)) tier = 1;
    else if (tier2.includes(num)) tier = 2;
    else if (tier3.includes(num)) tier = 3;
    
    return { column, tier };
}

// Exporter les définitions pour l'affichage
const COLUMN_NUMBERS = {
    1: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
    2: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    3: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]
};

const TIER_NUMBERS = {
    1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    2: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    3: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]
};

/**
 * Logs the classification of a set of numbers for debugging
 * @param {Array<number>} numbers - Array of numbers to classify
 */
function logClassifications(numbers) {
    console.log('Number classifications:');
    numbers.forEach((num, index) => {
        const { column, tier } = classifyNumber(num);
        console.log(`[${index}] Number ${num}: Column ${column}, Tier ${tier}`);
    });
}

/**
 * Detects absence patterns for columns and tiers in the number history
 * @param {Array<number>} numbers - Array of roulette numbers (most recent first)
 * @returns {Object} Object containing consecutive absence counts for each column and tier
 */
function detectAbsence(numbers) {
    // Initialize absence counters
    const absences = {
        columns: { 1: 0, 2: 0, 3: 0 },
        tiers: { 1: 0, 2: 0, 3: 0 }
    };
    
    // Logique: pour chaque colonne/tier, on cherche sa première occurrence dans l'historique
    // Si on la trouve à la position i, alors l'absence est i (0 = plus récent, 1 = 2ème plus récent, etc.)
    // Si on ne la trouve pas dans les nombres disponibles, on met 5 (ou le nombre max disponible)
    
    // Pour chaque colonne, trouver la position de sa première occurrence
    for (let c = 1; c <= 3; c++) {
        // Rechercher la première occurrence de cette colonne
        let found = false;
        for (let i = 0; i < numbers.length; i++) {
            const { column } = classifyNumber(numbers[i]);
            if (column === c) {
                absences.columns[c] = i; // Position = nombre d'absences
                found = true;
                break;
            }
        }
        
        // Si pas trouvé, mettre le maximum (nombre de tours disponibles)
        if (!found) {
            absences.columns[c] = Math.min(numbers.length, 30); // Max 30 pour éviter des valeurs trop grandes
        }
    }
    
    // Pour chaque tier, faire la même chose
    for (let t = 1; t <= 3; t++) {
        // Rechercher la première occurrence de ce tier
        let found = false;
        for (let i = 0; i < numbers.length; i++) {
            const { tier } = classifyNumber(numbers[i]);
            if (tier === t) {
                absences.tiers[t] = i; // Position = nombre d'absences
                found = true;
                break;
            }
        }
        
        // Si pas trouvé, mettre le maximum (nombre de tours disponibles)
        if (!found) {
            absences.tiers[t] = Math.min(numbers.length, 30); // Max 30 pour éviter des valeurs trop grandes
        }
    }
    
    console.log('Historique analysé:', numbers.slice(0, 5));
    console.log('Absences calculées:', absences);
    
    return absences;
}

/**
 * Detects if there is a pattern of no repetition (continuous changes) in columns or tiers
 * @param {Array<number>} numbers - Array of roulette numbers (most recent first)
 * @param {number} minLength - Minimum number of consecutive changes required (default: 5)
 * @returns {Object} Object containing no repetition signals for columns and tiers
 */
function detectNoRepetition(numbers, minLength = 5) {
    // Need at least minLength+1 numbers to check for minLength changes
    if (numbers.length < minLength + 1) {
        return { columns: false, tiers: false };
    }
    
    // Get classifications for the numbers
    const classifications = [];
    for (let i = 0; i < numbers.length; i++) {
        classifications.push(classifyNumber(numbers[i]));
    }
    
    // Check for column changes
    let columnChanges = true;
    let previousColumn = classifications[0].column;
    
    for (let i = 1; i < minLength; i++) {
        const currentColumn = classifications[i].column;
        
        // Skip zeros (they don't count as repetition or change)
        if (currentColumn === null || previousColumn === null) {
            columnChanges = false;
            break;
        }
        
        // If same column as previous, no continuous change
        if (currentColumn === previousColumn) {
            columnChanges = false;
            break;
        }
        
        previousColumn = currentColumn;
    }
    
    // Check if the minLength change is different from the one before
    // (to ensure it's not just stabilized at a pattern)
    if (columnChanges && numbers.length > minLength) {
        const olderColumn = classifyNumber(numbers[minLength]).column;
        if (olderColumn === classifications[minLength-1].column) {
            columnChanges = false; // Pattern has stabilized
        }
    }
    
    // Check for tier changes
    let tierChanges = true;
    let previousTier = classifications[0].tier;
    
    for (let i = 1; i < minLength; i++) {
        const currentTier = classifications[i].tier;
        
        // Skip zeros
        if (currentTier === null || previousTier === null) {
            tierChanges = false;
            break;
        }
        
        // If same tier as previous, no continuous change
        if (currentTier === previousTier) {
            tierChanges = false;
            break;
        }
        
        previousTier = currentTier;
    }
    
    // Check if the minLength change is different from the one before
    if (tierChanges && numbers.length > minLength) {
        const olderTier = classifyNumber(numbers[minLength]).tier;
        if (olderTier === classifications[minLength-1].tier) {
            tierChanges = false; // Pattern has stabilized
        }
    }
    
    // Return results
    return {
        columns: columnChanges,
        tiers: tierChanges
    };
}

/**
 * Detects betting signals based on absence patterns
 * @param {Object} absences - Object containing absence counts
 * @param {number} minAbsence - Minimum absence to trigger a signal (default: 5)
 * @returns {Object|null} Signal object or null if no signal
 */
function detectSignal(absences, minAbsence = 5) {
    let bestSignal = null;
    let maxAbsence = 0;
    
    // Check columns
    for (let c = 1; c <= 3; c++) {
        const absence = absences.columns[c];
        if (absence >= minAbsence && absence > maxAbsence) {
            maxAbsence = absence;
            bestSignal = {
                type: 'COLUMN',
                target: c,
                absence: absence
            };
        }
    }
    
    // Check tiers
    for (let t = 1; t <= 3; t++) {
        const absence = absences.tiers[t];
        if (absence >= minAbsence && absence > maxAbsence) {
            maxAbsence = absence;
            bestSignal = {
                type: 'TIER',
                target: t,
                absence: absence
            };
        }
    }
    
    return bestSignal;
}

/**
 * Builds the betting result based on the detected signal
 * @param {Object} signal - The detected signal
 * @param {number} maxBet - Maximum bet value in the series
 * @param {Array} lastNumbers - The last numbers played (used to check for hits)
 * @returns {Object} Betting recommendation
 */
function buildBetResult(signal, maxBet = 8, lastNumbers = []) {
    if (!signal) {
        return {
            signalType: "AUCUN",
            target: "-",
            absence: 0,
            betSeries: [],
            nextBet: 0
        };
    }
    
    // Filter the betting series up to the maximum bet
    const betSeries = DEFAULT_BET_SERIES.filter(bet => bet <= maxBet);
    
    const type = signal.type.toLowerCase();
    const target = signal.target;
    
    // Check if the last number hit the target (if we have a last number)
    if (lastNumbers.length > 0) {
        const lastNum = lastNumbers[0]; // Newest number is at index 0
        const classification = classifyNumber(lastNum);
        
        if (type === 'column' && classification.column === target) {
            // Hit! Reset the bet index
            betIndices.columns[target] = 0;
            signalHits.columns[target] = true;
        } else if (type === 'tier' && classification.tier === target) {
            // Hit! Reset the bet index
            betIndices.tiers[target] = 0;
            signalHits.tiers[target] = true;
        } else {
            // Miss! Increment the bet index if we were already betting on this target
            if (type === 'column' && !signalHits.columns[target]) {
                betIndices.columns[target] = Math.min(betIndices.columns[target] + 1, betSeries.length - 1);
            } else if (type === 'tier' && !signalHits.tiers[target]) {
                betIndices.tiers[target] = Math.min(betIndices.tiers[target] + 1, betSeries.length - 1);
            } else {
                // New signal, start from the beginning
                if (type === 'column') {
                    betIndices.columns[target] = 0;
                    signalHits.columns[target] = false;
                } else {
                    betIndices.tiers[target] = 0;
                    signalHits.tiers[target] = false;
                }
            }
        }
    }
    
    // Get the current bet index for this target
    const betIndex = type === 'column' ? betIndices.columns[target] : betIndices.tiers[target];
    
    // If we've reached the max bet and still haven't hit, reset to the first bet
    if (betSeries[betIndex] === maxBet) {
        if (type === 'column') {
            betIndices.columns[target] = 0;
        } else {
            betIndices.tiers[target] = 0;
        }
    }
    
    // Get the updated bet index
    const updatedBetIndex = type === 'column' ? betIndices.columns[target] : betIndices.tiers[target];
    
    return {
        signalType: signal.type,
        target: target,
        absence: signal.absence,
        betSeries: betSeries,
        nextBet: betSeries[updatedBetIndex]
    };
}

/**
 * Validates an array of roulette numbers
 * @param {Array<number>} numbers - Array of numbers to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateNumbers(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) {
        return false;
    }
    
    // Check if all numbers are valid roulette numbers (0-36)
    return numbers.every(num => {
        const numValue = parseInt(num);
        return !isNaN(numValue) && numValue >= 0 && numValue <= 36;
    });
}

/**
 * Main analysis function that processes the number history and returns betting recommendations
 * @param {Array<number>} numbers - Array of roulette numbers (most recent first)
 * @param {number} maxBet - Maximum bet value in the series
 * @returns {Object} Analysis result with betting recommendations for columns and tiers
 */
function analyzeRouletteHistory(numbers, maxBet = 8) {
    // Validate input
    if (!validateNumbers(numbers) || numbers.length < 5) {
        return { 
            column: { signalType: "AUCUN", target: "-", absence: 0, betSeries: [], nextBet: 0 },
            tier: { signalType: "AUCUN", target: "-", absence: 0, betSeries: [], nextBet: 0 },
            noRepetitionColumn: { signalType: "AUCUN", target: "-", betSeries: [], nextBet: 0 },
            noRepetitionTier: { signalType: "AUCUN", target: "-", betSeries: [], nextBet: 0 }
        };
    }
    
    // Make a copy of the numbers array to avoid modifying the original
    const numbersCopy = [...numbers];
    
    // Detect absences
    const absences = detectAbsence(numbersCopy);
    console.log('Absences detected:', absences);
    
    // Detect no repetition patterns
    const noRepetition = detectNoRepetition(numbersCopy);
    console.log('No repetition patterns:', noRepetition);
    
    // Find best column signal (absence)
    let bestColumnSignal = null;
    let maxColumnAbsence = 4; // Must be at least 5 to be a signal
    
    for (let c = 1; c <= 3; c++) {
        const absence = absences.columns[c];
        if (absence >= 5 && absence > maxColumnAbsence) {
            maxColumnAbsence = absence;
            bestColumnSignal = {
                type: 'COLUMN',
                target: c,
                absence: absence
            };
        }
    }
    
    // Find best tier signal (absence)
    let bestTierSignal = null;
    let maxTierAbsence = 4; // Must be at least 5 to be a signal
    
    for (let t = 1; t <= 3; t++) {
        const absence = absences.tiers[t];
        if (absence >= 5 && absence > maxTierAbsence) {
            maxTierAbsence = absence;
            bestTierSignal = {
                type: 'TIER',
                target: t,
                absence: absence
            };
        }
    }
    
    // Create no repetition signals if detected
    let noRepetitionColumnSignal = null;
    let noRepetitionTierSignal = null;
    
    // If we have a no repetition pattern for columns, create a signal
    if (noRepetition.columns) {
        // Determine the most likely next column based on recent patterns
        // For no repetition, we predict it will repeat the most recent column
        const mostRecentNumber = numbersCopy[0];
        const { column } = classifyNumber(mostRecentNumber);
        
        if (column !== null) {
            noRepetitionColumnSignal = {
                type: 'NO_REPETITION_COLUMN',
                target: column,
                description: 'Colonnes changeantes sans répétition'
            };
        }
    }
    
    // If we have a no repetition pattern for tiers, create a signal
    if (noRepetition.tiers) {
        // Determine the most likely next tier based on recent patterns
        // For no repetition, we predict it will repeat the most recent tier
        const mostRecentNumber = numbersCopy[0];
        const { tier } = classifyNumber(mostRecentNumber);
        
        if (tier !== null) {
            noRepetitionTierSignal = {
                type: 'NO_REPETITION_TIER',
                target: tier,
                description: 'Tiers changeants sans répétition'
            };
        }
    }
    
    console.log('Best Column Signal (Absence):', bestColumnSignal);
    console.log('Best Tier Signal (Absence):', bestTierSignal);
    console.log('No Repetition Column Signal:', noRepetitionColumnSignal);
    console.log('No Repetition Tier Signal:', noRepetitionTierSignal);
    
    // Build results for absence signals
    const columnResult = bestColumnSignal ? 
        buildBetResult(bestColumnSignal, maxBet, numbersCopy) : 
        { signalType: "AUCUN", target: "-", absence: 0, betSeries: [], nextBet: 0 };
        
    const tierResult = bestTierSignal ? 
        buildBetResult(bestTierSignal, maxBet, numbersCopy) : 
        { signalType: "AUCUN", target: "-", absence: 0, betSeries: [], nextBet: 0 };
    
    // Build results for no repetition signals
    const noRepetitionColumnResult = noRepetitionColumnSignal ? 
        buildBetResult(noRepetitionColumnSignal, maxBet, numbersCopy) : 
        { signalType: "AUCUN", target: "-", betSeries: [], nextBet: 0 };
        
    const noRepetitionTierResult = noRepetitionTierSignal ? 
        buildBetResult(noRepetitionTierSignal, maxBet, numbersCopy) : 
        { signalType: "AUCUN", target: "-", betSeries: [], nextBet: 0 };
    
    return {
        column: columnResult,
        tier: tierResult,
        noRepetitionColumn: noRepetitionColumnResult,
        noRepetitionTier: noRepetitionTierResult
    };
}
