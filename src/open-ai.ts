import { OpenAI } from 'openai';
import config from './config';

// Initialize OpenAI configuration
const openai = new OpenAI({
    apiKey: config.apiKey
});

/**
 * Fetch completion from OpenAI API for code completion
 * @param prompt The input prompt
 * @returns The sanitized completion string
 */
export async function fetchOpenAICompletion(prompt: string): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a code generator. Always respond with code only, no explanations or markdown.' },
                { role: 'user', content: `Complete the following code (the completion should not duplicate the code segments):\n\n${prompt}` },
            ],
            max_tokens: 150,
            temperature: 0.5,
        });

        // Extract raw text from the response
        let completion = response.choices[0]?.message?.content?.trim() || '';

        // Sanitize: Remove markdown formatting and code block wrappers
        completion = completion.replace(/```[\s\S]*?\n/g, '').replace(/```/g, '');

        // Remove duplicate user input (if completion repeats the start of the prompt)
        if (completion.startsWith(prompt.trim())) {
            completion = completion.slice(prompt.trim().length).trim();
        }

        return completion;
    } catch (error) {
        console.error('Error fetching OpenAI completion:', error);
        throw new Error('Failed to fetch OpenAI completion');
    }
}

/**
 * Fetch code suggestion from OpenAI API based on a natural language comment
 * @param comment The user's comment in natural language
 * @returns The generated code suggestion
 */
export async function fetchCodeForComment(comment: string): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful code assistant. Generate code based on natural language descriptions.' },
                { role: 'user', content: `Generate code for the following comment:\n\n${comment}` },
            ],
            max_tokens: 200,
            temperature: 0.7,
        });

        // Extract raw text from the response
        let completion = response.choices[0]?.message?.content?.trim() || '';

        // Sanitize: Remove markdown formatting and code block wrappers
        completion = completion.replace(/```[\s\S]*?\n/g, '').replace(/```/g, '');

        return completion;
    } catch (error) {
        console.error('Error fetching code suggestion for comment:', error);
        throw new Error('Failed to fetch code suggestion for comment');
    }
}
