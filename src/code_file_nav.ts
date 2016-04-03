'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as commands from './commands';

export interface fileData {
    label: string;
    name: string;
    path: string;
    isFile: boolean;
    isDirectory: boolean;
}

export let cwd: string = '';

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
        let stats: fs.Stats = fs.lstatSync(dir);

        if (!stats.isDirectory()) { return; }
    } catch (err) {
        checkError(err);

        return;
    }

    cwd = dir;

    fs.readdir(dir, (err, results) => {
        if (checkError(err)) { return; }

        // Build a lookup table
        let files: fileData[] = results.reduce((arr, file) => {
            try {
                let fullPath: string = path.join(dir, file);
                let stats: fs.Stats = fs.lstatSync(fullPath);
                let isFile = stats.isFile();
                let isDirectory = stats.isDirectory();

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

        let cmdData = { cwd, files };
        let options: string[] = commands.getList('top', cmdData).concat(
            files.map(file => file.label),
            commands.getList('bottom', cmdData)
        );

        vscode.window.showQuickPick(options).then(label => {
            if (!label) { return; }

            const file: fileData = files.find(file => file.label === label);

            // If a command is being run then don't show the default list of files and folders
            if (commands.handle(label, cmdData)) { return; }

            if (file.isDirectory) {
                showFileList(file.path);
            } else if (file.isFile) {
                vscode.workspace.openTextDocument(file.path).then(doc => {
                    vscode.window.showTextDocument(doc);
                });
            }
        });
    });
}