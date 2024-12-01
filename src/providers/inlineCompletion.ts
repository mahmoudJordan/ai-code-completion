import * as vscode from 'vscode';
import { fetchOpenAICompletion, fetchCodeForComment } from '../api/open-ai';

class GPTInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private suggestionActive = false; // Tracks if a suggestion is currently active

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionList> {
        const textBeforeCursor = document.getText(new vscode.Range(new vscode.Position(0, 0), position));

        if (!this.suggestionActive && context.triggerKind === vscode.InlineCompletionTriggerKind.Invoke) {
            console.log('Providing inline completion suggestions...');
            this.suggestionActive = true;

            try {
                const suggestion = await fetchOpenAICompletion(textBeforeCursor);
                const trimmedSuggestion = suggestion.trimStart();

                const completionItem = new vscode.InlineCompletionItem(trimmedSuggestion);
                completionItem.range = new vscode.Range(position, position);

                return new vscode.InlineCompletionList([completionItem]);
            } catch (error) {
                console.error('Error fetching completion:', error);
                return new vscode.InlineCompletionList([]);
            } finally {
                this.suggestionActive = false;
            }
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

        vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    });

    context.subscriptions.push(inlineCompletionProvider, manualSuggestionCommand, onCommentCompleteListener);
}
