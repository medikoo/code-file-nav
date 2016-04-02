'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as codeFileNav from './code_file_nav';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.codeFileNav', () => {
        let editor: vscode.TextEditor = vscode.window.activeTextEditor;
        let workspace: string = vscode.workspace.rootPath;
        let dir: string = '/';

        if (editor) {
            dir = path.dirname(editor.document.fileName);
        } else if (workspace) {
            dir = workspace;
        }

        codeFileNav.showFileList(dir);
    });

    context.subscriptions.push(disposable);
}
