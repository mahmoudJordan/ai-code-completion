import * as vscode from 'vscode';
import { fetchOpenAICompletion, fetchCodeForComment } from './open-ai'; // Import OpenAI API logic

// Inline Completion Provider
class GPTInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private suggestionActive = false; // Tracks if a suggestion is currently active

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionList> {
        const textBeforeCursor = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
        const currentLine = document.lineAt(position.line).text.trim();

        // Old behavior: Suggestion triggered manually with Alt + S
        if (!this.suggestionActive && context.triggerKind === vscode.InlineCompletionTriggerKind.Invoke) {
            console.log('Providing inline completion suggestions...');
            this.suggestionActive = true; // Mark suggestion as active

            try {
                // Fetch suggestion from OpenAI
                const suggestion = await fetchOpenAICompletion(textBeforeCursor);

                // Create an inline completion item
                const completionItem = new vscode.InlineCompletionItem(suggestion);
                completionItem.insertText = suggestion;
                completionItem.range = new vscode.Range(position, position);

                return new vscode.InlineCompletionList([completionItem]);
            } catch (error: any) {
                console.error('Error fetching completion:', error);
                return new vscode.InlineCompletionList([]);
            } finally {
                this.suggestionActive = false; // Reset the state after processing
            }
        }

        console.log('No suggestion triggered.');
        return new vscode.InlineCompletionList([]); // No suggestions
    }

    resetSuggestionState() {
        this.suggestionActive = false; // Allow new suggestions after reset
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension activated');

    const provider = new GPTInlineCompletionProvider();

    // Register Inline Completion Provider
    const inlineCompletionProvider = vscode.languages.registerInlineCompletionItemProvider(
        { pattern: '**' },
        provider
    );

    const onCommentCompleteListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== event.document) return;
    
        // Get the current line where the user pressed Enter
        const position = editor.selection.active;
        const currentLine = editor.document.lineAt(position.line).text.trim();
    
        // Check if the previous line contains a comment
        const previousLine = position.line > 0 ? editor.document.lineAt(position.line - 1).text.trim() : '';
        const isSingleLineComment = previousLine.startsWith('//') || previousLine.startsWith('#');
        const isMultiLineCommentClosed = previousLine.endsWith('*/');
    
        if (isSingleLineComment || isMultiLineCommentClosed) {
            console.log(`Comment detected: "${previousLine}", fetching suggestion...`);
    
            try {
                // Fetch suggestion based on the comment
                const suggestion = await fetchCodeForComment(previousLine);
    
                // Insert the suggestion below the comment
                const insertPosition = new vscode.Position(position.line, 0);
                await editor.edit((editBuilder) => {
                    editBuilder.insert(insertPosition, suggestion + '\n');
                });
    
                console.log('Suggestion successfully inserted.');
            } catch (error: any) {
                console.error('Error fetching suggestion for comment:', error);
            }
        }
    });
    

    // Register Command to Trigger Inline Suggestions (Alt + S)
    const manualSuggestionCommand = vscode.commands.registerCommand('extension.triggerInlineSuggestion', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor!');
            return;
        }

        provider.resetSuggestionState(); // Reset state before triggering new suggestions
        vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    });

    context.subscriptions.push(inlineCompletionProvider, manualSuggestionCommand, onCommentCompleteListener);
    console.log('Inline completion provider and commands registered.');
}

// Deactivate Extension
export function deactivate() { }
