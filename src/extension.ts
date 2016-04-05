'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as codeFileNav from './code_file_nav';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.codeFileNav', () => {
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('codeFileNav');
        const defaultFolders: string[] = config.get('defaultFolder', '').split('|');
        const editor: vscode.TextEditor = vscode.window.activeTextEditor;
        const workspaceFolder: string = vscode.workspace.rootPath;
        let dir: string = '';

        defaultFolders.forEach(defaultFolder => {
            if (dir) { return; }

            defaultFolder = defaultFolder
                .toLowerCase()
                .replace(/\${home}/gi, os.homedir());

            if (defaultFolder === '${folder}' && editor && editor.document.fileName) {
                dir = path.dirname(editor.document.fileName);
            } else if (defaultFolder === '${workspace}' && workspaceFolder) {
                dir = workspaceFolder;
            } else {
                try {
                    fs.accessSync(defaultFolder);

                    dir = defaultFolder;
                } catch (err) { }
            }
        });

        if (!dir) {
            dir = os.homedir();
        }

        codeFileNav.showFileList(dir);
    });

    context.subscriptions.push(disposable);
}
