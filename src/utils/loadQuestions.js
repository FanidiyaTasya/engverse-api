const fs = require('fs');
const path = require('path');

const validSections = ['reading', 'listening', 'structure'];

function loadQuestions(section) {
  if (!validSections.includes(section)) {
    throw new Error('Section tidak valid');
  }

  const filePath = path.join(__dirname, '..', 'data', `${section}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File soal untuk section ${section} tidak ditemukan`);
  }

  const questionsJson = fs.readFileSync(filePath, 'utf-8');
  const questions = JSON.parse(questionsJson);

  return questions;
}

module.exports = loadQuestions;
