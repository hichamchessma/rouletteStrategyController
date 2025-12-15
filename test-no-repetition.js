// Test de la logique de no-repetition
const { calculateNoRepetitionCounts, classifyNumber } = require('./roulette-logic.js');

// Exemple 1: 5, 24, 24, 28, 33, 27, 17, 25, 14, 20
const numbers1 = [5, 24, 24, 28, 33, 27, 17, 25, 14, 20];
console.log('Exemple 1:');
console.log('Séquence:', numbers1);
console.log('Classifications:');
console.log(numbers1.map(n => ({ num: n, ...classifyNumber(n) })));
const result1 = calculateNoRepetitionCounts(numbers1);
console.log('Résultat No-Repetition:', result1);
console.log('Valeurs attendues:');
console.log('C1: 1, C2: 1X, C3: 1');
console.log('T1: 1Y, T2: 1, T3: 1');

console.log('\n-----------------------------------\n');

// Exemple 2: 7, 20, 34, 25, 1, 2, 34, 30, 12, 12
const numbers2 = [7, 20, 34, 25, 1, 2, 34, 30, 12, 12];
console.log('Exemple 2:');
console.log('Séquence:', numbers2);
console.log('Classifications:');
console.log(numbers2.map(n => ({ num: n, ...classifyNumber(n) })));
const result2 = calculateNoRepetitionCounts(numbers2);
console.log('Résultat No-Repetition:', result2);
console.log('Valeurs attendues:');
console.log('C1: 2X, C2: 2, C3: 2');
console.log('T1: 2, T2: 2, T3: 2Y');
