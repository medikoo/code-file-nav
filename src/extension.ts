'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as child_process from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    let lastCwd: string = '';

    function showFileList(dir?: string) {
        dir = dir || lastCwd;

        if (!dir) {
            return;
        }

        try {
            let stats = fs.lstatSync(dir);

            if (!stats.isDirectory()) {
                return;
            }
        } catch (err) {
            return;
        }

        lastCwd = dir;

        fs.readdir(dir, (err, files) => {
            files = files.filter(file => {
                try {
                    let fullPath = path.join(dir, file);
                    let stats = fs.lstatSync(fullPath);

                    return stats.isDirectory() || stats.isFile();
                } catch (err) {
                    return false;
                }
            });

            let commands = [
                '> New File',
                '> New Folder',
                '> Delete',
            ];

            let options = ['..'].concat(files, commands);

            vscode.window.showQuickPick(options).then(file => {
                if (!file) {
                    return;
                }

                let isCmd = true;

                switch (file) {
                    case '> New File': {
                        vscode.window.showInputBox({
                            placeHolder: 'Enter your new file name'
                        }).then(fileName => {
                            if (!fileName) {
                                showFileList();

                                return;
                            }

                            fs.writeFile(path.join(lastCwd, fileName), '', (err) => {
                                showFileList();
                            });
                        });

                        break;
                    }
                    case '> New Folder': {
                        vscode.window.showInputBox({
                            placeHolder: 'Enter your new folder name'
                        }).then(folderName => {
                            if (!folderName) {
                                showFileList();

                                return;
                            }

                            fs.mkdir(path.join(lastCwd, folderName), (err) => {
                                showFileList();
                            });
                        });

                        break;
                    }
                    case '> Delete': {
                        vscode.window.showQuickPick(files).then(file => {
                            if (!file) {
                                showFileList();

                                return;
                            }

                            let fullPath = path.join(dir, file);

                            fs.lstat(fullPath, (err, stats) => {
                                if (!stats.isFile() && !stats.isDirectory()) {
                                    return;
                                }

                                let type = stats.isFile() ? 'file' : 'folder';
                                let cmd = os.platform() === 'win32' ? 'rmdir /s /q' : 'rm -rf';

                                vscode.window.showQuickPick(['No', 'Yes'], {
                                    placeHolder: `Are you sure you want to delete the "${file}" ${type}?`
                                }).then(answer => {
                                    if (answer === 'Yes') {
                                        if (type === 'file') {
                                            fs.unlink(fullPath, (err) => {
                                                showFileList();
                                            });
                                        } else if (type === 'folder') {
                                            child_process.exec(cmd + ' ' + fullPath, (err, stdout, stderr) => {
                                                if (err) {
                                                    vscode.window.showErrorMessage(err.message);
                                                }

                                                showFileList();
                                            });
                                        }
                                    } else {
                                        showFileList();
                                    }
                                });
                            });
                        });

                        break;
                    }
                    default: {
                        isCmd = false;
                        break;
                    }
                }

                // If a command is being run then don't show the default list of files and folders
                if (isCmd) {
                    return;
                }

                let fullPath = path.join(dir, file);

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

    let disposable = vscode.commands.registerCommand('extension.codeFileNav', () => {
        let editor = vscode.window.activeTextEditor;
        let cwd = '/';

        if (editor) {
            cwd = path.dirname(editor.document.fileName);
        }

        showFileList(cwd);
    });

    context.subscriptions.push(disposable);
}
