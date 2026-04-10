exports.handler = async function(event) {
  var API_KEY = 'AIzaSyBK1aR4h7vUa82rHFwaHaqORD17dvytLB8';
  var url = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + API_KEY;
  
  var res = await fetch(url);
  var data = await res.json();
  
  var models = (data.models || [])
    .filter(function(m){ return (m.supportedGenerationMethods||[]).includes('generateContent'); })
    .map(function(m){ return m.name; });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ available: models })
  };
};
