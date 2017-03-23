'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as commands from './commands';

export interface FileData {
    label: string;
    name: string;
    path: string;
    isFile: boolean;
    isDirectory: boolean;
}

let cwd: string = '';

export function checkError(err: NodeJS.ErrnoException): boolean {
    if (err) {
        vscode.window.showErrorMessage(err.message);
    }

    return !!err;
}

export function showFileList(dir?: string): void {
    dir = dir || cwd;

    if (!dir) { return; }

    try {
        const stats: fs.Stats = fs.lstatSync(dir);

        if (!stats.isDirectory()) { return; }
    } catch (err) {
        checkError(err);

        return;
    }

    cwd = dir;

    fs.readdir(cwd, (err, results) => {
        if (checkError(err)) { return; }

        // Build a lookup table
        const files: FileData[] = results.reduce((arr, file) => {
            try {
                const fullPath: string = path.join(cwd, file);
                const stats: fs.Stats = fs.lstatSync(fullPath);
                const isFile = stats.isFile();
                const isDirectory = stats.isDirectory();

                if (isFile || isDirectory) {
                    arr.push({
                        label: file,
                        name: file,
                        path: fullPath,
                        isFile,
                        isDirectory,
                    });
                }
            } catch (err) { }

            return arr;
        }, []);

        const cmdData = { cwd, files };
        const options: string[] = commands.getList('top', cmdData).concat(
            files.map(file => file.label),
            commands.getList('bottom', cmdData)
        );

        vscode.window.showQuickPick(options).then(label => {
            if (!label) { return; }

            const file: FileData = files.find(file => file.label === label);

            // If a command is being run then don't show the default list of files and folders
            if (commands.handle(label, cmdData)) { return; }

            if (file.isDirectory) {
                showFileList(file.path);
            } else if (file.isFile) {
                vscode.workspace.openTextDocument(file.path).then(doc => {
                    vscode.window.showTextDocument(doc, vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined);
                });
            }
        });
    });
}
