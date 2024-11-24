import * as vscode from 'vscode';
import { fetchOpenAICompletion, fetchCodeForComment } from './open-ai'; // Import OpenAI API logic

class GPTInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private suggestionActive = false; // Tracks if a suggestion is currently active

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionList> {
        const textBeforeCursor = document.getText(new vscode.Range(new vscode.Position(0, 0), position));

        // Only trigger if manually invoked or programmatically required
        if (!this.suggestionActive && context.triggerKind === vscode.InlineCompletionTriggerKind.Invoke) {
            console.log('Providing inline completion suggestions...');
            this.suggestionActive = true; // Mark suggestion as active

            try {
                // Fetch suggestion from OpenAI
                const suggestion = await fetchOpenAICompletion(textBeforeCursor);

                // Trim and align the suggestion
                const trimmedSuggestion = suggestion.trimStart();

                // Create and return an inline completion item
                const completionItem = new vscode.InlineCompletionItem(trimmedSuggestion);

                // Ensure the range starts exactly at the cursor position
                completionItem.range = new vscode.Range(position, position);

                return new vscode.InlineCompletionList([completionItem]);
            } catch (error) {
                console.error('Error fetching completion:', error);
                return new vscode.InlineCompletionList([]);
            } finally {
                this.suggestionActive = false; // Reset the state after processing
            }
        }

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

        const position = editor.selection.active;
        const previousLine = position.line > 0 ? editor.document.lineAt(position.line).text.trim() : '';
        const isSingleLineComment = previousLine.startsWith('//') || previousLine.startsWith('#');
        const isMultiLineCommentClosed = previousLine.endsWith('*/');

        if (isSingleLineComment || isMultiLineCommentClosed) {
            console.log(`Comment detected: "${previousLine}", fetching suggestion...`);

            try {
                const codeBeforeComment = editor.document.getText(
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(position.line, 0))
                );

                // Fetch suggestion based on the comment and the context
                const suggestion = await fetchCodeForComment(previousLine, codeBeforeComment);

                // Trim and align the suggestion
                const trimmedSuggestion = suggestion.trimStart();

                // Trigger inline suggestion explicitly
                const completionItem = new vscode.InlineCompletionItem(trimmedSuggestion);
                completionItem.range = new vscode.Range(position, position);

                // Register inline completion
                await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');

                console.log('Suggestion successfully displayed.');
            } catch (error) {
                console.error('Error fetching suggestion for comment:', error);
            }
        }
    });

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

export function deactivate() {}
