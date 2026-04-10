exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  var API_KEY = 'AIzaSyDjObztmgdVQ20Q6WSNPSxJTgMK8Q3-Yrs';
  var BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

  // Models to try in order - confirmed in available list
  var MODELS = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite-001',
    'gemini-2.0-flash-001',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemma-3-27b-it',
    'gemma-3-12b-it'
  ];

  try {
    var body = JSON.parse(event.body);
    var userMessage = body.messages[0].content;

    var fullPrompt = 'You are a publishing consultant. Reply ONLY with a valid JSON object. No markdown, no backticks, no explanation. Start with { and end with }.\n\n' + userMessage;

    var geminiBody = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
    };

    var lastError = '';

    for (var i = 0; i < MODELS.length; i++) {
      var model = MODELS[i];
      var url = BASE + model + ':generateContent?key=' + API_KEY;

      try {
        var response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody)
        });

        var data = await response.json();

        // Skip if model error
        if (data.error) {
          lastError = model + ': ' + data.error.message;
          continue;
        }

        // Success
        var text = '';
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          text = data.candidates[0].content.parts[0].text || '';
        }

        if (!text) {
          lastError = model + ': empty response';
          continue;
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ content: [{ type: 'text', text: text }], model_used: model })
        };

      } catch (fetchErr) {
        lastError = model + ': ' + fetchErr.message;
        continue;
      }
    }

    // All models failed
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'كل الـmodels فشلت. آخر error: ' + lastError })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
