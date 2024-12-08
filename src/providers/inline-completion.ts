import * as vscode from 'vscode';
import { fetchOpenAICompletion } from '../api/open-ai';

class GPTInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private suggestionActive = false; // Tracks if a suggestion is currently active
    private typingTimeout: NodeJS.Timeout | null = null; // Timeout for debounce

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionList> {
        const textBeforeCursor = document.getText(new vscode.Range(new vscode.Position(0, 0), position));

        // Only trigger on explicit invocation or after typing delay
        if (context.triggerKind === vscode.InlineCompletionTriggerKind.Invoke || !this.suggestionActive) {
            return new Promise((resolve) => {
                // Clear any existing timeout
                if (this.typingTimeout) {
                    clearTimeout(this.typingTimeout);
                }

                // Set a new timeout for 1 second
                this.typingTimeout = setTimeout(async () => {
                    if (this.suggestionActive) {
                        resolve(new vscode.InlineCompletionList([]));
                        return;
                    }

                    console.log('Providing inline completion suggestions...');
                    this.suggestionActive = true;

                    try {
                        const suggestion = await fetchOpenAICompletion(textBeforeCursor);
                        const trimmedSuggestion = suggestion.trimStart();

                        const completionItem = new vscode.InlineCompletionItem(trimmedSuggestion);
                        completionItem.range = new vscode.Range(position, position);

                        resolve(new vscode.InlineCompletionList([completionItem]));
                    } catch (error) {
                        console.error('Error fetching completion:', error);
                        resolve(new vscode.InlineCompletionList([]));
                    } finally {
                        this.suggestionActive = false;
                    }
                }, 1000);
            });
        }

        return new vscode.InlineCompletionList([]);
    }
}

export function registerInlineCompletionProvider(context: vscode.ExtensionContext) {
    const provider = new GPTInlineCompletionProvider();
    const inlineCompletionProvider = vscode.languages.registerInlineCompletionItemProvider(
        { pattern: '**' },
        provider
    );

    const manualSuggestionCommand = vscode.commands.registerCommand('extension.triggerInlineSuggestion', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor!');
            return;
        }

        vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    });

    context.subscriptions.push(inlineCompletionProvider, manualSuggestionCommand);
}
