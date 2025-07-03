/**
 * Extracts JSON data from text that may contain markdown code blocks
 * Handles cases where AI responses wrap JSON in ```json...``` blocks
 */
export function extractJsonFromText(text: string): unknown {
  try {
    // First try to parse the text directly as JSON
    return JSON.parse(text);
  } catch (error) {
    // If direct parsing fails, try to extract JSON from markdown code blocks
    
    // Remove any leading/trailing whitespace
    const cleanText = text.trim();
    
    // Look for JSON code blocks (```json...``` or ```...```)
    const jsonCodeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?```/i;
    const match = cleanText.match(jsonCodeBlockRegex);
    
    if (match && match[1]) {
      try {
        // Extract the content inside the code block and parse it
        const jsonContent = match[1].trim();
        return JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('Failed to parse JSON from code block:', parseError);
        throw new Error(`Invalid JSON in code block: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }
    
    // If no code block found, try to find JSON-like content
    // Look for content that starts with { or [ and ends with } or ]
    const jsonObjectRegex = /(\{[\s\S]*\}|\[[\s\S]*\])/;
    const objectMatch = cleanText.match(jsonObjectRegex);
    
    if (objectMatch && objectMatch[1]) {
      try {
        return JSON.parse(objectMatch[1]);
      } catch (parseError) {
        console.error('Failed to parse extracted JSON object:', parseError);
        throw new Error(`Invalid JSON object: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }
    
    // If all else fails, throw the original error
    console.error('No valid JSON found in text:', text.substring(0, 200) + '...');
    throw new Error(`No valid JSON found in response text. Original error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Safely extracts JSON with fallback to a default value
 */
export function safeExtractJson<T>(text: string, fallback: T): T {
  try {
    return extractJsonFromText(text) as T;
  } catch (error) {
    console.warn('JSON extraction failed, using fallback:', error);
    return fallback;
  }
}
