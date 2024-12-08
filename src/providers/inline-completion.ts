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
        const currentLineText = document.lineAt(position.line).text.trim();

        // Skip if the current line is a comment
        if (currentLineText.startsWith('//') || currentLineText.startsWith('#') || currentLineText.startsWith('/*') || currentLineText.endsWith('*/')) {
            console.log('Skipping suggestion - current line is a comment.');
            return new vscode.InlineCompletionList([]);
        }

        // Skip if the current line has fewer than 3 characters
        if (currentLineText.length < 3) {
            const previousLine = position.line > 0 ? document.lineAt(position.line - 1).text.trim() : '';
            const isPreviousLineComment = previousLine.startsWith('//') || previousLine.startsWith('#') || previousLine.startsWith('/*') || previousLine.endsWith('*/');

            if (!isPreviousLineComment) {
                console.log('Skipping suggestion - less than 3 characters on the current line and previous line is not a comment.');
                return new vscode.InlineCompletionList([]);
            }

            console.log('Previous line is a comment. Proceeding to fetch suggestions.');
        }

        // Trigger inline completion
        if (context.triggerKind === vscode.InlineCompletionTriggerKind.Invoke || !this.suggestionActive) {
            return new Promise((resolve) => {
                if (this.typingTimeout) {
                    clearTimeout(this.typingTimeout);
                }

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
