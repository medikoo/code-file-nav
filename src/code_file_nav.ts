'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cmds from './commands';

export let cwd: string = '';

export function showFileList(dir?: string): void {
    dir = dir || cwd;

    if (!dir) {
        return;
    }

    try {
        let stats: fs.Stats = fs.lstatSync(dir);

        if (!stats.isDirectory()) {
            return;
        }
    } catch (err) {
        return;
    }

    cwd = dir;

    fs.readdir(dir, (err, files) => {
        files = files.filter(file => {
            try {
                let fullPath: string = path.join(dir, file);
                let stats: fs.Stats = fs.lstatSync(fullPath);

                return stats.isDirectory() || stats.isFile();
            } catch (err) {
                return false;
            }
        });

        let commands: string[] = [
            '> New file',
            '> New folder',
            '> Rename',
            '> Delete',
            '> Change drive',
        ];

        let options: string[] = ['..'].concat(files, commands);

        vscode.window.showQuickPick(options).then(file => {
            if (!file) {
                return;
            }

            let isCmd: boolean = true;

            switch (file) {
                case '> New file': cmds.newFile(cwd); break;
                case '> New folder': cmds.newFolder(cwd); break;
                case '> Rename': cmds.rename(cwd, files); break;
                case '> Delete': cmds.remove(cwd, files); break;
                case '> Change drive': cmds.changeDrive(); break;
                default: isCmd = false; break;
            }

            // If a command is being run then don't show the default list of files and folders
            if (isCmd) {
                return;
            }

            let fullPath: string = path.join(dir, file);

            fs.lstat(fullPath, (err, stats) => {
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