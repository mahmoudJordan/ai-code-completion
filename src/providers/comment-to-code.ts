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
        const previousLine = position.line > 0 ? editor.document.lineAt(position.line - 1).text.trim() : '';
        const isSingleLineComment = previousLine.startsWith('//') || previousLine.startsWith('#');
        const isMultiLineCommentClosed = previousLine.endsWith('*/');

        // Trigger only if Enter was pressed after a comment
        if (event.contentChanges.some(change => change.text === '\n') && (isSingleLineComment || isMultiLineCommentClosed)) {
            console.log(`Comment detected: "${previousLine}", fetching suggestion...`);

            try {
                const codeBeforeComment = editor.document.getText(
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(position.line - 1, previousLine.length))
                );

                // Fetch suggestion based on the comment and the context
                const suggestion = await fetchCodeForComment(previousLine, codeBeforeComment);

                // Add the suggestion directly to the editor
                const trimmedSuggestion = suggestion.trimStart();
                await editor.edit(editBuilder => {
                    editBuilder.insert(position, `\n${trimmedSuggestion}`);
                });

                console.log('Suggestion successfully inserted.');
            } catch (error) {
                console.error('Error fetching suggestion for comment:', error);
            }
        }
    });

    context.subscriptions.push(onCommentCompleteListener);
}
