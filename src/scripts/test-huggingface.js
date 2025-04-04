require('dotenv').config();
const axios = require('axios');

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/';
// Try a few different models - from largest to smallest
const MODELS_TO_TEST = [
  'mistralai/Mistral-7B-Instruct-v0.2', // Your current model
  'facebook/blenderbot-400M-distill',    // Smaller model
  'microsoft/DialoGPT-medium',           // Even smaller
  'EleutherAI/gpt-neo-125m'              // Very small
];

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

async function testModels() {
  const testPrompt = "What kind of running shoes would you recommend for beginners?";
  
  console.log("Testing Hugging Face API with different models...");
  console.log("API Key:", HUGGINGFACE_API_KEY ? "Present" : "Missing");
  
  for (const model of MODELS_TO_TEST) {
    console.log(`\nTesting model: ${model}`);
    
    try {
      console.time(`${model} response time`);
      
      const response = await axios.post(
        `${HUGGINGFACE_API_URL}${model}`,
        { inputs: testPrompt },
        {
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 seconds timeout
        }
      );
      
      console.timeEnd(`${model} response time`);
      
      let result;
      if (Array.isArray(response.data)) {
        result = response.data[0].generated_text;
      } else {
        result = response.data.generated_text;
      }
      
      console.log("Success! First 100 chars of response:");
      console.log(result.substring(0, 100) + "...");
      console.log("Response length:", result.length);
      
    } catch (error) {
      console.timeEnd(`${model} response time`);
      console.error(`Error with ${model}:`, error.message);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
    }
  }
}

testModels().catch(console.error);