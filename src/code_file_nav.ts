'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as commands from './commands';

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

    fs.readdir(dir, (err, files) => {
        if (checkError(err)) { return; }

        files = files.filter(file => {
            try {
                let fullPath: string = path.join(dir, file);
                let stats: fs.Stats = fs.lstatSync(fullPath);

                return stats.isDirectory() || stats.isFile();
            } catch (err) { return; }
        });

        let cmdOptions: string[] = commands.getList();
        let options: string[] = ['..'].concat(files, cmdOptions);

        vscode.window.showQuickPick(options).then(file => {
            if (!file) { return; }

            // If a command is being run then don't show the default list of files and folders
            if (commands.handle(file, { cwd, files })) { return; }

            let fullPath: string = path.join(dir, file);

            fs.lstat(fullPath, (err, stats) => {
                if (checkError(err)) { return; }

                if (stats.isDirectory()) {
                    showFileList(fullPath);
                } else if (stats.isFile()) {
                    vscode.workspace.openTextDocument(fullPath).then(doc => {
                        vscode.window.showTextDocument(doc);
                    });
                }
            });
        });
    });
}