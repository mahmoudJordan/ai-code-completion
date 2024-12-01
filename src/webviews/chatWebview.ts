import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { replyMessage } from '../api/open-ai';

export class ChatWebview implements vscode.WebviewViewProvider {
    public static readonly viewType = 'chatgpt.chatView'; // Replace 'yourExtension' with your extension's ID
    private _view?: vscode.WebviewView;

    constructor(private readonly _context: vscode.ExtensionContext) {}

    // This is called when the view is resolved
    public resolveWebviewView(webviewView: vscode.WebviewView): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true, // Allow JavaScript execution in the webview
        };

        // Set the HTML content of the webview
        webviewView.webview.html = this.getHtmlContent(webviewView.webview);

        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'sendMessage') {
                    const userMessage = message.text;
                    try {
                        const response = await replyMessage(userMessage);
                        webviewView.webview.postMessage({ type: 'response', text: response });
                    } catch (error) {
                        console.error('Error sending message to ChatGPT:', error);
                        webviewView.webview.postMessage({
                            type: 'response',
                            text: 'Error: Unable to fetch response.',
                        });
                    }
                }
            },
            undefined,
            this._context.subscriptions
        );
    }

    // Retrieve the HTML content for the webview
    private getHtmlContent(webview: vscode.Webview): string {
        const htmlPath = path.join(this._context.extensionPath, 'src', 'media', 'chat.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

        // Update relative paths in the HTML file to use VS Code's `webview.asWebviewUri`
        const mediaUri = (filePath: string) =>
            webview.asWebviewUri(vscode.Uri.file(path.join(this._context.extensionPath, 'src', 'media', filePath)));

        // Replace CSS and JS paths in the HTML content
        htmlContent = htmlContent
            .replace(/src="highlight.min.js"/g, `src="${mediaUri('highlight.min.js')}"`)
            .replace(/href="highlight.css"/g, `href="${mediaUri('highlight.css')}"`);

        return htmlContent;
    }

    // Post a message to the webview
    public postMessage(message: any): void {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }
}
