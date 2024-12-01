import * as vscode from 'vscode';
import { registerInlineCompletionProvider } from './providers/inlineCompletion';
import { ChatWebview } from './webviews/chatWebview';

export function activate(context: vscode.ExtensionContext) {
    console.log('ChatGPT Extension activated');

    // Register Inline Completion Provider
    registerInlineCompletionProvider(context);

    // Add Chat Box to Activity Bar
    const chatWebviewProvider = new ChatWebview(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatWebview.viewType, chatWebviewProvider)
    );

    console.log('ChatGPT view registered.');
}

export function deactivate() {
    console.log('ChatGPT Extension deactivated');
}
