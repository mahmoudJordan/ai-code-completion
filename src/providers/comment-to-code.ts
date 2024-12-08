import * as vscode from 'vscode';
import { fetchCodeForComment } from '../api/open-ai';

/**
 * Registers a listener for changes in the editor and fetches code suggestions
 * based on comments.
 */
export function registerCommentCompletionListener(context: vscode.ExtensionContext) {
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

    context.subscriptions.push(onCommentCompleteListener);
}
